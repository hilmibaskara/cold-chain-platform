import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
// Interface for Supabase nested query response
interface ForecastProductRow {
  id_product: number;
  quantity_forecast: number;
  products: {
    product_name: string;
    temperature_threshold: number;
    supplier_products: {
      id_supplier: number;
    }[];
  };
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const forecast_date = body.forecast_date;

  if (!forecast_date) {
    return NextResponse.json({ error: "Missing forecast_date" }, { status: 400 });
  }

  // Step 1: Get forecast_id from forecast_date
  const { data: forecastResult, error: forecastResultError } = await supabase
    .from("forecast_results")
    .select("id_forecast")
    .eq("forecast_date", forecast_date)
    .single();

  if (forecastResultError || !forecastResult) {
    console.error(forecastResultError);
    return NextResponse.json({ error: "Forecast not found for given date" }, { status: 404 });
  }

  const forecast_id = forecastResult.id_forecast;

  // Step 2: Get forecast products with supplier info
  const { data: forecastData, error: forecastDataError } = await supabase
    .from("forecast_products")
    .select(`
      id_product,
      quantity_forecast,
      products (
        product_name,
        temperature_threshold,
        supplier_products (
          id_supplier
        )
      )
    `)
    .eq("id_forecast", forecast_id);

  if (forecastDataError || !forecastData) {
    console.error(forecastDataError);
    return NextResponse.json({ error: "Failed to get forecast products" }, { status: 500 });
  }

  // Collect all temperature_threshold
  const temperatureThresholds = forecastData.map((row) => {
    const product = row.products;
    return product.temperature_threshold
  });

  // Get minimum threshold for delivery
  const deliveryThreshold = Math.min(...temperatureThresholds);

  console.log("maximum threshold ", deliveryThreshold)

  // Step 3: Group by supplier
  const supplierOrders: Record<number, { id_product: number; quantity: number }[]> = {};

  for (const row of forecastData as ForecastProductRow[]) {
    if (!row.products) {
      return NextResponse.json({ error: "Product data missing" }, { status: 400 });
    }

    const product = row.products;
    const supplierList = product.supplier_products;

    console.log(temperatureThresholds)

    // const deliveryThreshold = Math.min(...temperatureThresholds);

    if (!supplierList || supplierList.length === 0) {
      return NextResponse.json({ error: `No supplier found for product ${product.product_name}` }, { status: 400 });
    }

    const supplierId = supplierList[0].id_supplier;

    if (!supplierOrders[supplierId]) {
      supplierOrders[supplierId] = [];
    }

    supplierOrders[supplierId].push({
      id_product: row.id_product,
      quantity: row.quantity_forecast,
    });
  }

  // Step 4: Insert orders + order_products
  const insertedOrderIds: number[] = [];

  for (const [supplierIdStr, products] of Object.entries(supplierOrders)) {
    const supplierId = parseInt(supplierIdStr, 10);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          id_supplier: supplierId,
          order_date: forecast_date,
        },
      ])
      .select("id_order")
      .single();

    if (orderError || !order) {
      console.error(orderError);
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    insertedOrderIds.push(order.id_order);

    const orderProducts = products.map((p) => ({
      id_order: order.id_order,
      id_product: p.id_product,
      quantity: p.quantity,
    }));

    const { error: productError } = await supabase
      .from("order_products")
      .insert(orderProducts);

    if (productError) {
      console.error(productError);
      return NextResponse.json({ error: "Failed to insert order_products" }, { status: 500 });
    }
  }

  // Step 5: Create delivery & assign orders
  // Ambil id_supplier dari order pertama
  const { data: firstOrder, error: firstOrderError } = await supabase
    .from("orders")
    .select("id_supplier")
    .eq("id_order", insertedOrderIds[0])
    .single();

  if (firstOrderError || !firstOrder) {
    return NextResponse.json({ error: "Failed to fetch first order supplier" }, { status: 500 });
  }

  const { data: supplierData, error: supplierError } = await supabase
    .from("suppliers")
    .select("latitude, longitude")
    .eq("id_supplier", firstOrder.id_supplier)
    .single();

  if (supplierError || !supplierData) {
    return NextResponse.json({ error: "Failed to fetch supplier location" }, { status: 500 });
  }

  const departLat = supplierData.latitude;
  const departLon = supplierData.longitude;

  const { data: cafeData, error: cafeError } = await supabase
  .from("cafes")
  .select("id_cafe, latitude, longitude")
  .eq("id_cafe", 1)  // hardcoded sementara
  .single();

  if (cafeError || !cafeData) {
    return NextResponse.json({ error: "Failed to fetch cafe destination" }, { status: 500 });
  }

  const { data: delivery, error: deliveryError } = await supabase
    .from("deliveries")
    .insert([
      {
        delivery_status: "draft",
        temperature_threshold: deliveryThreshold,
        plan_date: forecast_date,   // <-- ini yang baru ditambahkan
        depart_lat: departLat,
        depart_lon: departLon,
        arrive_lat: cafeData.latitude,
        arrive_lon: cafeData.longitude,
      }
    ])
    .select("id_delivery")
    .single();

  if (deliveryError || !delivery) {
    console.error(deliveryError);
    return NextResponse.json({ error: "Failed to create delivery" }, { status: 500 });
  }

  // Update orders with delivery id
  const { error: updateError } = await supabase
    .from("orders")
    .update({ id_delivery: delivery.id_delivery })
    .in("id_order", insertedOrderIds);

  if (updateError) {
    console.error(updateError);
    return NextResponse.json({ error: "Failed to assign orders to delivery" }, { status: 500 });
  }

  return NextResponse.json({ message: "Delivery plan generated successfully", id_delivery: delivery.id_delivery });
}
