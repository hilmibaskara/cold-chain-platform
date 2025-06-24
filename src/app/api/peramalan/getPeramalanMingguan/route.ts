import { supabase } from "@/utils/supabase/client";
import { NextRequest, NextResponse } from "next/server";

// Type definitions for the database response structure
interface Product {
  product_name: string;
}

interface ForecastProduct {
  quantity_forecast: number;
  products: Product[] | Product | null;
}

interface ForecastResult {
  forecast_date: string;
  forecast_products: ForecastProduct[] | ForecastProduct | null;
}

// Type for the flattened result
interface FlattenedForecastResult {
  forecast_date: string;
  product_name: string;
  quantity_forecast: number;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  console.log("API route called!");
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    console.log("API called with params:", { startDate, endDate });

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      );
    }

    // First, let's try a simpler query to test the connection
    const { data, error } = await supabase
      .from("forecast_results")
      .select("*")
      .gte("forecast_date", startDate)
      .lte("forecast_date", endDate)
      .order("forecast_date", { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        {
          error: error.message,
          details: error.details,
          hint: error.hint,
        },
        { status: 500 }
      );
    }

    console.log("Raw data from forecast_results:", data);

    // If the simple query works, try the complex one
    const { data: complexData, error: complexError } = await supabase
      .from("forecast_results")
      .select(
        `forecast_date,
          forecast_products (
            quantity_forecast,
            products (
              product_name
            )
          )`
      )
      .gte("forecast_date", startDate)
      .lte("forecast_date", endDate)
      .order("forecast_date", { ascending: true });

    if (complexError) {
      console.error("Complex query error:", complexError);
      return NextResponse.json(
        {
          error: complexError.message,
          details: complexError.details,
          hint: complexError.hint,
        },
        { status: 500 }
      );
    }

    console.log("Complex query data:", JSON.stringify(complexData, null, 2));

    // Check if data exists and has the expected structure
    if (!complexData || complexData.length === 0) {
      return NextResponse.json([]);
    }

    // Flatten result with better error handling
    const result: FlattenedForecastResult[] = [];

    (complexData as ForecastResult[]).forEach((fr: ForecastResult) => {
      console.log("Processing forecast result:", fr);

      if (!fr.forecast_products) {
        console.warn(`No forecast_products for date: ${fr.forecast_date}`);
        return;
      }

      // Handle both single object and array cases
      const forecastProducts = Array.isArray(fr.forecast_products)
        ? fr.forecast_products
        : [fr.forecast_products];

      forecastProducts.forEach((fp: ForecastProduct) => {
        console.log("Processing forecast product:", fp);

        if (!fp.products) {
          console.warn(`No products for forecast on date: ${fr.forecast_date}`);
          return;
        }

        // Handle both single object and array cases for products
        const products = Array.isArray(fp.products)
          ? fp.products
          : [fp.products];

        products.forEach((product: Product) => {
          if (product && product.product_name) {
            result.push({
              forecast_date: fr.forecast_date,
              product_name: product.product_name,
              quantity_forecast: fp.quantity_forecast,
            });
          }
        });
      });
    });

    console.log("Final result:", result);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Unexpected error in API route:", err);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: err instanceof Error ? err.message : "Unknown error",
        stack: err instanceof Error ? err.stack : undefined,
      },
      { status: 500 }
    );
  }
}
