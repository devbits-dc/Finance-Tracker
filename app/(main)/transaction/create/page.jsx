import React from 'react'
import AddTransactionForm from './_components/transaction-form'
import { defaultCategories } from '@/data/categories'
import { getUserAccounts } from '@/actions/dashboard'
import { getTransaction } from '@/actions/transaction'

const AddTransactionPage = async({searchParams}) => {
  const accounts = await getUserAccounts();
const editId = searchParams?.edit;

  
  let initialData = null;
  if (editId) {
    const transaction = await getTransaction(editId);
     initialData=transaction
  }



  return (
      <div className="max-w-3xl mx-auto px-5">
          <h1 className="text-5xl gradient-title mb-8">{editId?"Edit":"Add"} Transction</h1>
      <AddTransactionForm accounts={accounts}
        categories={defaultCategories}
        editMode={!!editId}
        initialData={initialData}
      />
    </div>
  )
}

export default AddTransactionPage