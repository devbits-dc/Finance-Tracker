import { sendEmail } from "@/actions/send-email";
import { db } from "../prisma";
import { inngest } from "./client";
import EmailTemplate from "@/emails/template";

export const checkBudgetAlerts = inngest.createFunction(
  { name: "Check Budget Alerts" },
  { cron: "0 */6 * * *" }, // Every 6 hours
  async ({ step }) => {
    const budgets = await step.run("fetch-budgets", async () => {
      return await db.budget.findMany({
        include: {
          user: {
            include: {
              accounts: {
                where: {
                  isDefault: true,
                },
              },
            },
          },
        },
      });
    });

    for (const budget of budgets) {
      const defaultAccount = budget.user.accounts[0];
      if (!defaultAccount) continue; // Skip if no default account

      await step.run(`check-budget-${budget.id}`, async () => {
        const startDate = new Date();
        startDate.setDate(1); // First day of the month
        startDate.setMonth(startDate.getMonth() - 1); // Move to last month

        const endDate = new Date();
        endDate.setDate(1); // First day of current month

        console.log(`Checking expenses from ${startDate} to ${endDate}`);

        // Calculate total expenses for the default account only
        const expenses = await db.transaction.aggregate({
          where: {
            userId: budget.userId,
            accountId: defaultAccount.id, // Only consider default account
            type: "EXPENSE",
            date: {
              gte: startDate, // Start of last month
              lt: endDate, // Before current month starts
            },
          },
          _sum: {
            amount: true,
          },
        });

        const totalExpenses = expenses._sum.amount?.toNumber() || 0;
        const budgetAmount = budget.amount;
        const percentageUsed = (totalExpenses / budgetAmount) * 100;

        console.log(`Budget ID: ${budget.id}`);
        console.log(`Total Expenses: ₹${totalExpenses}`);
        console.log(`Budget Amount: ₹${budgetAmount}`);
        console.log(`Percentage Used: ${percentageUsed.toFixed(2)}%`);
        console.log(`Last Alert Sent: ${budget.lastAlertSent}`);

        if (
          percentageUsed >= 80 &&
          (!budget.lastAlertSent ||
            isNewMonth(new Date(budget.lastAlertSent), new Date()))
        ) {
          // Send Email
          await sendEmail({
            to: budget.user.email,
            subject: `Budget Alert for ${defaultAccount.name}`,
            react: EmailTemplate({
              userName: budget.user.name,
              type: "budget-alert",
              data: {
                percentageUsed,
                budgetAmount: parseFloat(budgetAmount).toFixed(1),
                totalExpenses: parseFloat(totalExpenses).toFixed(1),
                accountName: defaultAccount.name,
              },
            }),
          });

          // Update lastAlertSent
          try {
            await db.budget.update({
              where: { id: budget.id },
              data: { lastAlertSent: new Date() },
            });
            console.log(`Budget alert updated for Budget ID: ${budget.id}`);
          } catch (error) {
            console.error("Error updating budget:", error);
          }
        }
      });
    }
  }
);

function isNewMonth(lastAlertDate, currentDate) {
  if (!lastAlertDate) return true; // If no previous alert, treat as a new month
  return (
    lastAlertDate.getMonth() !== currentDate.getMonth() ||
    lastAlertDate.getFullYear() !== currentDate.getFullYear()
  );
}
