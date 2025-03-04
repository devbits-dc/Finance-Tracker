"use client";
import { getUserAccounts } from "@/actions/dashboard";
import CreateAccountDrawer from "@/components/CreateAccountDrawer";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import AccountCard from "./_components/account-card";
import { getCurrentBudget } from "@/actions/budget";
import BudgetProgress from "./_components/budget-progress";

const DashboardPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [budgetData, setBudgetData] = useState(null);

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

  const defaultAccount = accounts?.find((account) => account.isDefault);

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


  return (
    <div className="px-5">
      {/* Budget Progress */}
      {defaultAccount && (
        <BudgetProgress
          initialBudget={budgetData?.budget}
          currentExpenses={budgetData?.currentExpenses || 0} />
  )}


      {/* Overview */}
      {/* Accounts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
