// File: /pages/api/upload.js

import { createClient as createSupabaseClient } from '@/utils/supabase/server';

// Define interfaces for request body and response
interface SensorData {
    temperature: number;
    latitude: number;
    longitude: number;
}

// interface ApiResponse {
//     message: string;
// }

export async function POST(req: Request): Promise<Response> {
    try {
        const body = await req.json() as SensorData;
        const { temperature, latitude, longitude } = body;

        if (
            typeof temperature !== 'number' ||
            typeof latitude !== 'number' ||
            typeof longitude !== 'number'
        ) {
            return Response.json({ message: 'Invalid payload' }, { status: 400 });
        }

        const current_time = new Date().toISOString().replace('T', ' ').substring(0, 19);

        console.log(
            `[${current_time}] Temp=${temperature} °C | Lat=${latitude} | Lon=${longitude}`
        );

        // Insert into Supabase using existing client
        try {
            const supabase = await createSupabaseClient();
            const { error } = await supabase.from('sensor_data').insert({
                recorded_at: current_time,
                temperature,
                latitude,
                longitude,
            });

            if (error) {
                console.error('Supabase insert error:', error);
                return Response.json({ message: 'Error inserting to Supabase' }, { status: 500 });
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            return Response.json({ message: 'Unexpected error' }, { status: 500 });
        }

        return Response.json({ message: 'Data received and sent to Supabase' });
    } catch (error) {
        console.error('Request parsing error:', error);
        return Response.json({ message: 'Invalid request body' }, { status: 400 });
    }
}