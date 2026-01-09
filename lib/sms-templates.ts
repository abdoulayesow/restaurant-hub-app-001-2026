// lib/sms-templates.ts

interface NotificationContext {
  restaurantName: string
  locale?: 'fr' | 'en'
}

// Template functions for bilingual support (French default for Guinea)
export const smsTemplates = {
  lowStock: (itemName: string, currentStock: number, unit: string, ctx: NotificationContext) => {
    if (ctx.locale === 'en') {
      return `[${ctx.restaurantName}] LOW STOCK: ${itemName} is running low (${currentStock} ${unit} remaining). Please reorder soon.`
    }
    return `[${ctx.restaurantName}] STOCK BAS: ${itemName} est bientôt épuisé (${currentStock} ${unit} restants). Veuillez commander bientôt.`
  },

  criticalStock: (itemName: string, ctx: NotificationContext) => {
    if (ctx.locale === 'en') {
      return `[${ctx.restaurantName}] CRITICAL: ${itemName} is nearly out of stock! Immediate reorder required.`
    }
    return `[${ctx.restaurantName}] CRITIQUE: ${itemName} est presque épuisé! Commande immédiate requise.`
  },

  expenseApproved: (amount: number, category: string, ctx: NotificationContext) => {
    if (ctx.locale === 'en') {
      return `[${ctx.restaurantName}] Your expense of ${amount.toLocaleString()} GNF (${category}) has been APPROVED.`
    }
    return `[${ctx.restaurantName}] Votre dépense de ${amount.toLocaleString()} GNF (${category}) a été APPROUVÉE.`
  },

  expenseRejected: (amount: number, category: string, reason: string, ctx: NotificationContext) => {
    if (ctx.locale === 'en') {
      return `[${ctx.restaurantName}] Your expense of ${amount.toLocaleString()} GNF (${category}) was REJECTED. Reason: ${reason}`
    }
    return `[${ctx.restaurantName}] Votre dépense de ${amount.toLocaleString()} GNF (${category}) a été REJETÉE. Raison: ${reason}`
  },

  saleApproved: (amount: number, ctx: NotificationContext) => {
    if (ctx.locale === 'en') {
      return `[${ctx.restaurantName}] Your sale of ${amount.toLocaleString()} GNF has been APPROVED.`
    }
    return `[${ctx.restaurantName}] Votre vente de ${amount.toLocaleString()} GNF a été APPROUVÉE.`
  },

  saleRejected: (amount: number, reason: string, ctx: NotificationContext) => {
    if (ctx.locale === 'en') {
      return `[${ctx.restaurantName}] Your sale of ${amount.toLocaleString()} GNF was REJECTED. Reason: ${reason}`
    }
    return `[${ctx.restaurantName}] Votre vente de ${amount.toLocaleString()} GNF a été REJETÉE. Raison: ${reason}`
  },

  pendingApproval: (type: 'expense' | 'sale', count: number, ctx: NotificationContext) => {
    const typeText = type === 'expense'
      ? (ctx.locale === 'en' ? 'expenses' : 'dépenses')
      : (ctx.locale === 'en' ? 'sales' : 'ventes')

    if (ctx.locale === 'en') {
      return `[${ctx.restaurantName}] ${count} ${typeText} pending your approval. Review in Bakery Hub.`
    }
    return `[${ctx.restaurantName}] ${count} ${typeText} en attente de votre approbation. Vérifiez dans Bakery Hub.`
  },

  dailySummary: (
    totalSales: number,
    totalExpenses: number,
    profit: number,
    ctx: NotificationContext
  ) => {
    if (ctx.locale === 'en') {
      return `[${ctx.restaurantName}] Daily Summary: Sales: ${totalSales.toLocaleString()} GNF | Expenses: ${totalExpenses.toLocaleString()} GNF | Profit: ${profit.toLocaleString()} GNF`
    }
    return `[${ctx.restaurantName}] Résumé du jour: Ventes: ${totalSales.toLocaleString()} GNF | Dépenses: ${totalExpenses.toLocaleString()} GNF | Bénéfice: ${profit.toLocaleString()} GNF`
  },

  largeExpense: (amount: number, category: string, submitter: string, ctx: NotificationContext) => {
    if (ctx.locale === 'en') {
      return `[${ctx.restaurantName}] ALERT: Large expense of ${amount.toLocaleString()} GNF (${category}) submitted by ${submitter}. Review required.`
    }
    return `[${ctx.restaurantName}] ALERTE: Dépense importante de ${amount.toLocaleString()} GNF (${category}) soumise par ${submitter}. Vérification requise.`
  },
}
