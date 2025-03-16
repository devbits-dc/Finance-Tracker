"use client";
import { getDashboardData, getUserAccounts } from "@/actions/dashboard";
import CreateAccountDrawer from "@/components/CreateAccountDrawer";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import React, { Suspense, useEffect, useState } from "react";
import { AccountCard } from "./_components/account-card";
import { getCurrentBudget } from "@/actions/budget";
import BudgetProgress from "./_components/budget-progress";
import { DashboardOverview } from "./_components/transcation-overview";

const DashboardPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [budgetData, setBudgetData] = useState(null);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const data = await getUserAccounts();
        console.log("Accounts:", data);
        setAccounts(data || []);
      } catch (error) {
        console.error("Error fetching accounts:", error);
      }
    };

    fetchAccounts();
  }, []);

  const defaultAccount =
    accounts?.length > 0 ? accounts.find((account) => account.isDefault) : null;

  useEffect(() => {
    if (defaultAccount) {
      const fetchBudget = async () => {
        try {
          const budget = await getCurrentBudget(defaultAccount.id);
          setBudgetData(budget);
        } catch (error) {
          console.error("Error fetching budget:", error);
        }
      };

      fetchBudget();
    }
  }, [defaultAccount]);

 useEffect(() => {
   const fetchData = async () => {
     const data = await getDashboardData();
     setTransactions(data || []);
   };

   fetchData();
 }, [defaultAccount]);


  return (
    <div className="px-5 space-y-5">
      {/* Budget Progress */}
      {defaultAccount && (
        <BudgetProgress
          initialBudget={budgetData?.budget}
          currentExpenses={budgetData?.currentExpenses || 0}
        />
      )}

      {/* Overview */}
      <Suspense fallback={"Loading OverView..."}>
        <DashboardOverview
          accounts={accounts}
          transactions={transactions || []}
        />
      </Suspense>

      {/* Accounts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
        <CreateAccountDrawer>
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed">
            <CardContent className="flex flex-col items-center justify-center text-muted-foreground h-full pt-5">
              <Plus className="h-10 w-10 mb-2" />
              <p className="text-sm font-medium">Add New Account</p>
            </CardContent>
          </Card>
        </CreateAccountDrawer>

        {accounts.length > 0 &&
          accounts?.map((account) => {
            return <AccountCard key={account.id} account={account} />;
          })}
      </div>
    </div>
  );
};

export default DashboardPage;
