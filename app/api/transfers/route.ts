import { NextRequest, NextResponse } from "next/server";
import { createServerClient, tryCreateAdminClient } from "@/lib/supabase";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    // Use admin client for balance updates to bypass RLS
    // If service key is not available, return helpful error
    const adminSupabase = tryCreateAdminClient();
    
    if (!adminSupabase) {
      return NextResponse.json(
        { 
          error: "Service role key not configured", 
          details: "SUPABASE_SERVICE_ROLE_KEY is required for credit transfers. Please configure it in Vercel environment variables."
        },
        { status: 500 }
      );
    }
    
    // Get auth token from request
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { toUserId, toUniqueId, amount, note } = body;

    // Validation
    if ((!toUserId && !toUniqueId) || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: toUserId or toUniqueId, and amount" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Find receiver by UUID or unique_user_id
    let receiver;
    let receiverError;
    
    if (toUserId) {
      // Search by UUID
      const result = await supabase
        .from("users")
        .select("id, name, email, unique_user_id")
        .eq("id", toUserId)
        .single();
      receiver = result.data;
      receiverError = result.error;
    } else if (toUniqueId) {
      // Search by unique_user_id
      const result = await supabase
        .from("users")
        .select("id, name, email, unique_user_id")
        .eq("unique_user_id", toUniqueId.toUpperCase())
        .single();
      receiver = result.data;
      receiverError = result.error;
    }

    if (receiverError || !receiver) {
      return NextResponse.json(
        { error: "Receiver not found. Please check the User ID." },
        { status: 404 }
      );
    }

    if (user.id === receiver.id) {
      return NextResponse.json(
        { error: "Cannot transfer to yourself" },
        { status: 400 }
      );
    }

    // Check sender's balance
    const { data: sender, error: senderError } = await supabase
      .from("users")
      .select("account_balance")
      .eq("id", user.id)
      .single();

    if (senderError || !sender) {
      return NextResponse.json(
        { error: "Failed to fetch sender balance" },
        { status: 500 }
      );
    }

    if (sender.account_balance < amount) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // Try using the process_credit_transfer function first (if it exists)
    // This function uses SECURITY DEFINER and bypasses RLS
    let transferResult: any = null;
    let transferError: any = null;
    
    try {
      // Use admin client for RPC call to ensure it works
      const rpcResult = await adminSupabase
        .rpc('process_credit_transfer', {
          p_from_user_id: user.id,
          p_to_user_id: receiver.id,
          p_amount: amount,
          p_note: note || null
        });
      
      transferResult = rpcResult.data;
      transferError = rpcResult.error;
    } catch (err) {
      console.log("RPC function not available, using direct updates:", err);
      transferError = err;
    }

    // If RPC function failed or doesn't exist, use direct updates
    if (transferError || !transferResult || !transferResult.success) {
      console.log("Using direct update method...");
      
      // Perform atomic transfer manually using admin client to bypass RLS
      // Deduct from sender
      const newSenderBalance = Number(sender.account_balance) - Number(amount);
      const { data: updatedSender, error: deductError } = await adminSupabase
        .from("users")
        .update({ account_balance: newSenderBalance })
        .eq("id", user.id)
        .select("account_balance")
        .single();

      if (deductError) {
        console.error("Deduct error:", deductError);
        console.error("Deduct error details:", JSON.stringify(deductError, null, 2));
        return NextResponse.json(
          { 
            error: "Failed to deduct from sender", 
            details: deductError.message
          },
          { status: 500 }
        );
      }
      
      console.log("Sender balance updated:", {
        old: sender.account_balance,
        new: newSenderBalance,
        updated: updatedSender?.account_balance
      });

      // Get receiver's current balance
      const { data: receiverData, error: receiverFetchError } = await adminSupabase
        .from("users")
        .select("account_balance")
        .eq("id", receiver.id)
        .single();

      if (receiverFetchError || !receiverData) {
        // Rollback: add back to sender
        await adminSupabase
          .from("users")
          .update({ account_balance: sender.account_balance })
          .eq("id", user.id);
        
        return NextResponse.json(
          { error: "Failed to fetch receiver data" },
          { status: 500 }
        );
      }

      // Add to receiver
      const newReceiverBalance = Number(receiverData.account_balance || 0) + Number(amount);
      const { data: updatedReceiver, error: addError } = await adminSupabase
        .from("users")
        .update({ account_balance: newReceiverBalance })
        .eq("id", receiver.id)
        .select("account_balance")
        .single();

      if (addError) {
        // Rollback: add back to sender
        await adminSupabase
          .from("users")
          .update({ account_balance: sender.account_balance })
          .eq("id", user.id);
        
        console.error("Add error:", addError);
        console.error("Add error details:", JSON.stringify(addError, null, 2));
        return NextResponse.json(
          { 
            error: "Failed to add to receiver", 
            details: addError.message
          },
          { status: 500 }
        );
      }
      
      console.log("Receiver balance updated:", {
        old: receiverData.account_balance,
        new: newReceiverBalance,
        updated: updatedReceiver?.account_balance
      });
      
      // Record the transfer using admin client to ensure it's saved
      const { data: transferRecord, error: recordError } = await adminSupabase
        .from("credit_transfers")
        .insert({
          from_user_id: user.id,
          to_user_id: receiver.id,
          amount: amount,
          note: note || null,
          status: 'completed'
        })
        .select()
        .single();

      if (recordError) {
        console.error("Record error:", recordError);
        // Transfer already happened, just log the error
      }

      return NextResponse.json({
        success: true,
        message: `Successfully transferred $${amount} to ${receiver.name}`,
        transfer_id: transferRecord?.id,
        new_balance: newSenderBalance,
      });
    }

    // If RPC function succeeded
    console.log("Transfer processed successfully via RPC:", transferResult);
    
    // Get updated sender balance
    const { data: updatedSender } = await supabase
      .from("users")
      .select("account_balance")
      .eq("id", user.id)
      .single();
    
    const newSenderBalance = updatedSender?.account_balance || transferResult.new_balance;

    // The transfer is already recorded by the process_credit_transfer function
    // Just fetch it to return the transfer ID
    const { data: transferRecord } = await supabase
      .from("credit_transfers")
      .select("*")
      .eq("id", transferResult.transfer_id)
      .single();

    return NextResponse.json({
      success: true,
      message: `Successfully transferred $${amount} to ${receiver.name}`,
      transfer_id: transferRecord?.id,
      new_balance: newSenderBalance,
    });
  } catch (error) {
    console.error("Error processing transfer:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Get auth token from request
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get transfer history (both sent and received)
    const { data: transfers, error } = await supabase
      .from("credit_transfers")
      .select(`
        *,
        from_user:users!credit_transfers_from_user_id_fkey(id, name, email),
        to_user:users!credit_transfers_to_user_id_fkey(id, name, email)
      `)
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching transfers:", error);
      return NextResponse.json(
        { error: "Failed to fetch transfer history" },
        { status: 500 }
      );
    }

    return NextResponse.json(transfers || []);
  } catch (error) {
    console.error("Error fetching transfers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

