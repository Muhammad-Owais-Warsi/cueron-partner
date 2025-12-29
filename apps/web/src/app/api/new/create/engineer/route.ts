import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Parse body and log for debugging
    const body = await request.json();
    console.log('DEBUG: Received Request Body:', body);

    const { email, phone, name, role } = body;

    // 1. Validation Check
    if (!email || !name || !role) {
      return NextResponse.json(
        { error: { message: 'Missing fields', details: { email, name, role } } },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 2. Create Auth User
    console.log('DEBUG: Creating Auth User...');
    const { data: userRes, error: userErr } = await supabase.auth.admin.createUser({
      email,
      password: '123456', // Note: Consider generating a random password for production
      email_confirm: true,
      user_metadata: { name, phone, role },
    });

    if (userErr || !userRes?.user) {
      console.error('DEBUG ERROR: Auth user creation failed:', {
        message: userErr?.message,
        status: userErr?.status,
        code: userErr?.code,
      });
      return NextResponse.json(
        { error: { message: 'Auth creation failed', details: userErr } },
        { status: 500 }
      );
    }

    const userId = userRes.user.id;
    console.log('DEBUG: Auth User Created, ID:', userId);

    // 3. Insert into users_table
    console.log('DEBUG: Inserting into users_table...');
    const { error: usersTableErr } = await supabase.from('users').insert({
      id: userId,
      email,
      role,
    });

    if (usersTableErr) {
      console.error('DEBUG ERROR: users_table insert failed:', usersTableErr);

      // Cleanup
      await supabase.auth.admin.deleteUser(userId);

      return NextResponse.json(
        { error: { message: 'users_table insert failed', details: usersTableErr } },
        { status: 500 }
      );
    }

    // 4. Insert into new_engineers (only if role is engineer)
    if (role === 'engineer') {
      console.log('DEBUG: Role is engineer, inserting into new_engineers...');

      const { error: engErr } = await supabase.from('new_engineers').insert({
        user_id: userId,
        name,
        email,
        phone,
        // Spread remaining body fields to allow for dynamic data
      });

      if (engErr) {
        console.error('DEBUG ERROR: new_engineers insert failed:', engErr);

        // Comprehensive Rollback
        await supabase.from('users_table').delete().eq('id', userId);
        await supabase.auth.admin.deleteUser(userId);

        return NextResponse.json(
          { error: { message: 'Engineer table insert failed', details: engErr } },
          { status: 500 }
        );
      }
    }

    console.log('DEBUG: Flow completed successfully');
    return NextResponse.json(
      {
        message: 'User created successfully',
        user_id: userId,
        role,
      },
      { status: 201 }
    );
  } catch (error: any) {
    // Catch-all for JSON parsing errors or code crashes
    console.error('DEBUG CRITICAL ERROR:', error);
    return NextResponse.json(
      {
        error: {
          message: 'Server crashed during processing',
          details: error.message || error,
        },
      },
      { status: 500 }
    );
  }
}
