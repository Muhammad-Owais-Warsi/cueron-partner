// /**
//  * Create Ticket API Route
//  * POST /api/tickets/create
//  */

// import { NextRequest, NextResponse } from 'next/server';
// import { createAdminClient } from '@/lib/supabase/server';
// import { z } from 'zod';

// /**
//  * Validation schema — mirrors DB
//  */
// const ticketSchema = z.object({
//   company_name: z.string().min(1),
//   company_phone: z.string().min(8),
//   company_email: z.string().email(),

//   brand_name: z.string().min(1),
//   years_of_operation_in_equipment: z.number().optional(),

//   location: z.string().min(2),

//   inspection_date: z.string(),
//   inspection_time: z.string(),

//   photos: z.array(z.string()).optional(),

//   gst: z.string().min(5),
//   billing_address: z.string().min(5),

//   equipment_type: z.string().min(1),
//   equipment_sl_no: z.string().min(1),
//   capacity: z.number().optional(),

//   specification_plate_photo: z.string().optional(),

//   poc_name: z.string().min(2),
//   poc_phone: z.string().min(8),
//   poc_email: z.string().email(),

//   problem_statement: z.string().min(5),
// });

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();
//     const supabase = createAdminClient();

//     // Validate request
//     const parsed = ticketSchema.safeParse(body);

//     if (!parsed.success) {
//       return NextResponse.json(
//         {
//           error: {
//             code: 'VALIDATION_ERROR',
//             details: parsed.error.flatten().fieldErrors,
//           },
//         },
//         { status: 400 }
//       );
//     }

//     const t = parsed.data;
//     const inspectionDateTime = `${t.inspection_date}T${t.inspection_time}:00`;

//     /**
//      * Insert ticket
//      */
//     const { data, error } = await supabase
//       .from('tickets')
//       .insert({
//         company_name: t.company_name,
//         company_phone: t.company_phone,
//         company_email: t.company_email,

//         brand_name: t.brand_name,
//         years_of_operation_in_equipment: t.years_of_operation_in_equipment ?? null,

//         location: t.location,

//         inspection_date: inspectionDateTime,
//         inspection_time: inspectionDateTime,

//         photos: t.photos ?? null,

//         gst: t.gst,
//         billing_address: t.billing_address,

//         equipment_type: t.equipment_type,
//         equipment_sl_no: t.equipment_sl_no,
//         capacity: t.capacity ?? null,

//         specification_plate_photo: t.specification_plate_photo ?? null,

//         poc_name: t.poc_name,
//         poc_phone: t.poc_phone,
//         poc_email: t.poc_email,

//         problem_statement: t.problem_statement,
//       })
//       .select()
//       .single();

//     if (error) {
//       console.error('❌ DB insert error:', error);
//       return NextResponse.json(
//         {
//           error: {
//             code: 'DB_INSERT_FAILED',
//             message: error.message,
//           },
//         },
//         { status: 500 }
//       );
//     }

//     return NextResponse.json({ ticket: data }, { status: 201 });
//   } catch (err) {
//     console.error('❌ Ticket creation failed:', err);
//     return NextResponse.json(
//       {
//         error: {
//           code: 'INTERNAL_SERVER_ERROR',
//           message: 'Failed to create ticket',
//         },
//       },
//       { status: 500 }
//     );
//   }
// }
