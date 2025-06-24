import { createClient as createSupabaseClient } from '@/utils/supabase/server';

// Define interfaces for type safety
interface ProductForecast {
  id_product: number;
  quantity_forecast: number;
}

interface ForecastRequestBody {
  forecast_date: string;
  products: ProductForecast[];
}

interface ForecastProductInsert {
  id_forecast: number;
  id_product: number;
  quantity_forecast: number;
}

export async function POST(request: Request) {
  const body: ForecastRequestBody = await request.json();
  const { forecast_date, products } = body;

  const supabase = await createSupabaseClient();

  // Step 1: Insert into forecast_results
  const { data: forecastResult, error: insertForecastError } = await supabase
    .from('forecast_results')
    .insert([{ forecast_date }])
    .select('id_forecast')
    .single();

  if (insertForecastError) {
    return Response.json({ error: insertForecastError.message }, { status: 500 });
  }

  const id_forecast = forecastResult.id_forecast;

  // Step 2: Insert into forecast_products
  const forecastProducts: ForecastProductInsert[] = products.map((item: ProductForecast) => ({
    id_forecast,
    id_product: item.id_product,
    quantity_forecast: item.quantity_forecast
  }));

  const { error: insertProductsError } = await supabase
    .from('forecast_products')
    .insert(forecastProducts);

  if (insertProductsError) {
    return Response.json({ error: insertProductsError.message }, { status: 500 });
  }

  return Response.json({ message: 'Forecast inserted successfully', id_forecast }, { status: 200 });
}