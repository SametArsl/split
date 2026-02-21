"use server"

// What? Auth server actions holding the logic for Supabase login/signup.
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServer } from '@/lib/supabase-server';

export async function login(formData: FormData) {
  const supabase = await createServer();
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    console.error('Login Error:', error);
    if (error.message.includes('Email not confirmed') || error.message.includes('Email is not confirmed')) {
      redirect('/verify-email');
    }
    redirect(`/login?error=errors.login_failed`);
  }

  revalidatePath('/', 'layout');
  redirect('/groups'); // Redirect to dashboard after successful login
}

export async function signup(formData: FormData) {
  const supabase = await createServer();
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };
  const rawFullName = formData.get('fullName') as string;
  const fullName = rawFullName?.trim() || data.email.split('@')[0];

  // What? When signing up with Email Confirmation enabled, Supabase creates the user but might return a session as null.
  // We send the fullName in the user metadata so we can display it nicely later.
  const { data: signUpData, error } = await supabase.auth.signUp({
    ...data,
    options: {
      data: {
        full_name: fullName
      }
    }
  });

  if (error) {
    console.error('Signup Error:', error);
    redirect(`/register?error=errors.register_failed`);
  }

  // If session is null, it means email confirmation is required and an email was sent.
  if (!signUpData.session) {
    redirect('/verify-email');
  }

  revalidatePath('/', 'layout');
  redirect('/groups');
}
export async function logout() {
  const supabase = await createServer();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
