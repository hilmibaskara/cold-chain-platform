import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from '@/utils/supabase/server';


// Interface for Supabase nested query response
interface ForecastProduct {
  id_product: number;
  quantity_forecast: number;
  products: {
    product_name: string;
    supplier_products: {
      id_supplier: number;
    }[];
  }[];
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const forecast_id = body.forecast_id;

  if (!forecast_id) {
    return NextResponse.json({ error: "Missing forecast_id" }, { status: 400 });
  }

  const supabase = await createSupabaseClient();

  // Get forecast_products with products and supplier_products nested join
    const { data: forecastData, error: forecastError } = await supabase
    .from("forecast_products")
    .select(`
        id_product,
        quantity_forecast,
        products (
        product_name,
        supplier_products: supplier_products (
            id_supplier
        )
        )
    `)
    .eq("id_forecast", forecast_id);

  if (forecastError || !forecastData) {
    console.error(forecastError);
    return NextResponse.json({ error: "Failed to fetch forecast data" }, { status: 500 });
  }

  // Group by supplier
  const supplierOrders: Record<number, { id_product: number; quantity: number }[]> = {};

  for (const row of forecastData as ForecastProduct[]) {
    console.log(row.products)
    if (!row.products || row.products.length === 0) {
      return NextResponse.json({ error: "Product data missing" }, { status: 400 });
    }

    const product = row.products[0];
    console.log(product)
    const supplierList = product.supplier_products;

    if (!supplierList || supplierList.length === 0) {
      return NextResponse.json({ error: `No supplier found for product ${product.product_name}` }, { status: 400 });
    }

    // Simple: pick first supplier (bisa dikembangkan lebih pintar)
    const supplierId = supplierList[0].id_supplier;

    if (!supplierOrders[supplierId]) {
      supplierOrders[supplierId] = [];
    }

    supplierOrders[supplierId].push({
      id_product: row.id_product,
      quantity: row.quantity_forecast,
    });
  }

  // Insert new delivery
  const { data: delivery, error: deliveryError } = await supabase
    .from("deliveries")
    .insert([{ delivery_status: "draft" }])
    .select("id_delivery")
    .single();

  if (deliveryError) {
    console.error(deliveryError);
    return NextResponse.json({ error: "Failed to create delivery" }, { status: 500 });
  }

  const id_delivery = delivery.id_delivery;

  // Insert orders & order_products
  for (const [supplierIdStr, products] of Object.entries(supplierOrders)) {
    const supplierId = parseInt(supplierIdStr, 10);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          id_delivery,
          id_supplier: supplierId,
          order_date: new Date().toISOString().split("T")[0],
        },
      ])
      .select("id_order")
      .single();

    if (orderError) {
      console.error(orderError);
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    const id_order = order.id_order;

    const orderProducts = products.map((p) => ({
      id_order,
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

  return NextResponse.json({ message: "Delivery plan generated", id_delivery });
}
