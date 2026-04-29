import { supabase } from "./supabaseClient";

export async function listHotelStaffAccess(hotelId) {
  const { data, error } = await supabase.rpc("admin_list_hotel_staff", {
    p_hotel_id: hotelId,
  });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function grantHotelStaffAccess({ hotelId, email, role }) {
  const { data, error } = await supabase.rpc("admin_grant_hotel_staff_access", {
    p_hotel_id: hotelId,
    p_user_email: email,
    p_role: role,
  });

  if (error) {
    throw error;
  }

  const { data: emailData, error: emailError } = await supabase.functions.invoke("send-staff-access-email", {
    body: {
      hotelId,
      email,
      role,
    },
  });

  if (emailError) {
    console.error("Staff access email function failed", emailError);
  } else if (emailData?.ok === false) {
    console.error("Staff access email delivery reported a handled failure", emailData);
  }

  return data ?? [];
}

export async function revokeHotelStaffAccess({ hotelId, userId }) {
  const { data, error } = await supabase.rpc("admin_revoke_hotel_staff_access", {
    p_hotel_id: hotelId,
    p_user_id: userId,
  });

  if (error) {
    throw error;
  }

  return data;
}
