"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

const serializeTransaction = (obj) => {
  const serialized = { ...obj };
  if (obj.balance) {
    serialized.balance = obj.balance.toNumber();
  }

  if (obj.amount) {
    serialized.amount = obj.amount.toNumber();
  }
  return serialized;
};

export async function createAccount(data) {
  try {
    // Check authorization
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Find user in database
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) {
      throw new Error("User not found");
    }

    // 🛠 FIX: Convert balance to float before using
    if (!data.balance) {
      throw new Error("Balance is required");
    }

    const balanceFloat = parseFloat(data.balance); 
    if (isNaN(balanceFloat)) {
      throw new Error("Invalid balance amount");
    }

    // Check if this is the user's first account
    const existingAccount = await db.account.findMany({
      where: { userId: user.id },
    });

    // 🛠 FIX: Check for isDefault in data
    const shouldBeDefault =
      existingAccount.length === 0 ? true : !!data.isDefault;

    // If default, update other accounts
    if (shouldBeDefault) {
      await db.account.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false }, 
      });
    }

    // Create new account
    const account = await db.account.create({
      data: {
        ...data,
        balance: balanceFloat,
        userId: user.id,
        isDefault: shouldBeDefault,
      },
    });

    const serializedAccount = serializeTransaction(account);

    revalidatePath("/dashboard");
    return { success: true, data: serializedAccount };
  } catch (error) {
    return { success: false, message: error.message }; 
  }
}

//delete the code

export async function deleteAccount(accountId) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // find account
    const account = await db.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new Error("Account not Fount");
    }

    // Check if the user owns the account
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user || account.userId !== user.id) {
      throw new Error("Unauthorized");
    }

    // Delete the account
    await db.account.delete({
      where: { id: accountId },
    });
   
    if (account.isDefault) {
      const otherAccount = await db.account.findFirst({
        where: { userId: user.id },
      });
      if (otherAccount) {
        await db.account.update({
          where: { id: otherAccount.id },
          data: { isDefault: true },
        });
    }
    }
    revalidatePath("/dashboard");
    return { success: true, message: "Account deleted successfully" };
  }
  catch (error) {
   return { success: false, message: error.message };
  }
}

export async function getUserAccounts() {
   const { userId } = await auth();
   if (!userId) {
     throw new Error("Unauthorized");
   }

   // Find user in database
   const user = await db.user.findUnique({
     where: { clerkUserId: userId },
   });
   if (!user) {
     throw new Error("User not found");
  }
  
  const accounts = await db.account.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          transactions: true,
        }
      }
    }
  }); 
  const serializedAccount = accounts.map(serializeTransaction);

  return serializedAccount;
}
