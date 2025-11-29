import { tryCreateAdminClient } from "@/lib/supabase";

/**
 * Create a notification for a user
 * @param userId - The user ID to notify
 * @param title - Notification title
 * @param message - Notification message
 * @param type - Notification type (info, success, warning, error)
 * @param adminId - Optional admin ID if notification is from admin
 * @returns Promise<boolean> - True if notification was created successfully
 */
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: "info" | "success" | "warning" | "error" = "info",
  adminId?: string
): Promise<boolean> {
  try {
    const adminClient = tryCreateAdminClient();
    if (!adminClient) {
      console.warn("Admin client not available, notification not created");
      return false;
    }

    const { error } = await adminClient
      .from("notifications")
      .insert({
        user_id: userId,
        title: title,
        message: message,
        type: type,
        from_admin: !!adminId,
        admin_id: adminId || null,
        read: false,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error("❌ Error creating notification:", error);
      console.error("Notification details:", { userId, title, message, type, adminId });
      return false;
    }

    console.log("✅ Notification created successfully:", { 
      userId, 
      title, 
      type, 
      fromAdmin: !!adminId,
      timestamp: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error("Exception creating notification:", error);
    return false;
  }
}

/**
 * Create notification for trade execution
 */
export async function notifyTradeExecution(
  userId: string,
  symbol: string,
  type: "buy" | "sell",
  quantity: number,
  price: number,
  totalCost: number,
  adminId?: string
): Promise<boolean> {
  try {
    console.log("🔔 Creating trade execution notification:", { userId, symbol, type, quantity, price, totalCost, adminId });
    const action = type === "buy" ? "purchased" : "sold";
    const title = `Trade Executed: ${action.toUpperCase()} ${symbol}`;
    const message = `Your ${type === "buy" ? "purchase" : "sale"} of ${quantity} shares of ${symbol} at $${price.toFixed(2)} per share has been executed. Total ${type === "buy" ? "cost" : "value"}: $${totalCost.toFixed(2)}.`;
    
    const result = await createNotification(
      userId,
      title,
      message,
      "success",
      adminId
    );
    
    console.log("🔔 Trade notification result:", result);
    return result;
  } catch (error) {
    console.error("❌ Exception in notifyTradeExecution:", error);
    return false;
  }
}

/**
 * Create notification for balance modification
 */
export async function notifyBalanceModification(
  userId: string,
  action: "add" | "subtract" | "set",
  amount: number,
  previousBalance: number,
  newBalance: number,
  reason?: string,
  adminId?: string
): Promise<boolean> {
  try {
    console.log("🔔 Creating balance modification notification:", { userId, action, amount, previousBalance, newBalance, reason, adminId });
    let actionText = "";
    if (action === "add") {
      actionText = `Added $${amount.toFixed(2)}`;
    } else if (action === "subtract") {
      actionText = `Deducted $${amount.toFixed(2)}`;
    } else {
      actionText = `Set to $${amount.toFixed(2)}`;
    }

    const title = `Account Balance Updated`;
    let message = `${actionText} to your account. Previous balance: $${previousBalance.toFixed(2)}, New balance: $${newBalance.toFixed(2)}.`;
    
    if (reason) {
      message += ` Reason: ${reason}`;
    }

    const result = await createNotification(
      userId,
      title,
      message,
      action === "subtract" ? "warning" : "success",
      adminId
    );
    
    console.log("🔔 Balance notification result:", result);
    return result;
  } catch (error) {
    console.error("❌ Exception in notifyBalanceModification:", error);
    return false;
  }
}

/**
 * Create notification for user profile update
 */
export async function notifyProfileUpdate(
  userId: string,
  changes: string[],
  adminId?: string
): Promise<boolean> {
  const title = `Profile Updated`;
  const message = `Your profile has been updated: ${changes.join(", ")}.`;

  return createNotification(
    userId,
    title,
    message,
    "info",
    adminId
  );
}

/**
 * Create notification for certification update
 */
export async function notifyCertificationUpdate(
  userId: string,
  status: "pending" | "approved" | "rejected",
  notes?: string,
  adminId?: string
): Promise<boolean> {
  const title = `Certification Status Updated`;
  let message = `Your certification status has been updated to: ${status.toUpperCase()}.`;
  
  if (notes) {
    message += ` Notes: ${notes}`;
  }

  const type = status === "approved" ? "success" : status === "rejected" ? "error" : "warning";

  return createNotification(
    userId,
    title,
    message,
    type,
    adminId
  );
}

/**
 * Create notification for credit transfer
 */
export async function notifyCreditTransfer(
  fromUserId: string,
  toUserId: string,
  amount: number,
  note?: string,
  adminId?: string
): Promise<boolean> {
  // Notify sender
  const senderTitle = `Credit Transfer Sent`;
  const senderMessage = `You sent $${amount.toFixed(2)} to another user.${note ? ` Note: ${note}` : ""}`;
  await createNotification(fromUserId, senderTitle, senderMessage, "info", adminId);

  // Notify receiver
  const receiverTitle = `Credit Transfer Received`;
  const receiverMessage = `You received $${amount.toFixed(2)} from another user.${note ? ` Note: ${note}` : ""}`;
  await createNotification(toUserId, receiverTitle, receiverMessage, "success", adminId);

  return true;
}

