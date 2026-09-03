import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  writeBatch,
  Firestore,
  Unsubscribe,
  getDocFromServer
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  Auth
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  Category,
  Transaction,
  MonthlyBudget,
  SavedLocal,
  LocalType,
  BudgetGroup,
  TransactionType
} from '../types';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

export const AUTHORIZED_EMAIL: string =
  (typeof import.meta !== 'undefined' &&
    (import.meta as unknown as { env?: Record<string, string> })?.env?.VITE_AUTHORIZED_EMAIL) ||
  'rubenmassuquetto1999@gmail.com';

export function isUserAuthorized(user: User | null): boolean {
  if (!user || !user.email) return false;
  return user.email.trim().toLowerCase() === AUTHORIZED_EMAIL.toLowerCase();
}

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    if (getApps().length > 0) {
      app = getApp();
    } else {
      app = initializeApp(firebaseConfig);
    }
  }
  return app;
}

export function getFirebaseDb(): Firestore {
  if (!db) {
    const firebaseApp = getFirebaseApp();
    const databaseId = firebaseConfig.firestoreDatabaseId;
    db = databaseId && databaseId !== '(default)'
      ? getFirestore(firebaseApp, databaseId)
      : getFirestore(firebaseApp);
  }
  return db;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

export async function loginWithGoogle(): Promise<User> {
  const authInstance = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  const result = await signInWithPopup(authInstance, provider);
  return result.user;
}

export async function logoutUser(): Promise<void> {
  const authInstance = getFirebaseAuth();
  await signOut(authInstance);
}

export function subscribeAuth(callback: (user: User | null) => void): Unsubscribe {
  const authInstance = getFirebaseAuth();
  return onAuthStateChanged(authInstance, callback);
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface DatabaseErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentAuth = getFirebaseAuth();
  const errInfo: DatabaseErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuth.currentUser?.uid,
      email: currentAuth.currentUser?.email,
      emailVerified: currentAuth.currentUser?.emailVerified,
      isAnonymous: currentAuth.currentUser?.isAnonymous,
      tenantId: currentAuth.currentUser?.tenantId,
      providerInfo: currentAuth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Database Operation Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Clear all collections in database (Zero out)
export async function clearAllData(): Promise<void> {
  const firestore = getFirebaseDb();
  try {
    // 1. Delete all transactions
    const txRef = collection(firestore, 'transactions');
    const txSnap = await getDocs(txRef);
    if (!txSnap.empty) {
      const batch = writeBatch(firestore);
      txSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    // 2. Delete all categories if any
    const catRef = collection(firestore, 'categories');
    const catSnap = await getDocs(catRef);
    if (!catSnap.empty) {
      const batch = writeBatch(firestore);
      catSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, 'all');
  }
}

// Real-time Transactions listener
export function subscribeTransactions(
  onData: (transactions: Transaction[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const firestore = getFirebaseDb();
  const txRef = collection(firestore, 'transactions');
  const q = query(txRef, orderBy('date', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Transaction[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          date: data.date || '',
          type: data.type || 'saida',
          amount: Number(data.amount) || 0,
          local_name: data.local_name || '',
          local_type: data.local_type || 'fisico',
          description: data.description || '',
          category: data.category || 'Geral',
          subcategory: data.subcategory || '',
          budget_group: data.budget_group || 'essencial',
          notes: data.notes || '',
          created_at: data.created_at,
          updated_at: data.updated_at
        };
      });
      onData(items);
    },
    (err) => {
      console.error('Erro na sincronização de transações:', err);
      onError(err);
    }
  );
}

// Helper to generate a valid, consistent doc ID for a local
export function getLocalDocId(name: string): string {
  const clean = name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 50);
  return `loc_${clean || 'geral'}`;
}

// Record or update local in Firestore
export async function recordLocalUsage(data: {
  name: string;
  local_type?: LocalType;
  category?: string;
  subcategory?: string;
  budget_group?: BudgetGroup;
  type?: TransactionType;
  description?: string;
}): Promise<void> {
  if (!data.name || !data.name.trim()) return;
  const firestore = getFirebaseDb();
  const trimmedName = data.name.trim();
  const docId = getLocalDocId(trimmedName);

  try {
    const docRef = doc(firestore, 'locals', docId);
    let currentCount = 1;
    let existingData: any = null;

    try {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        existingData = snap.data();
        currentCount = (existingData.count || 0) + 1;
      }
    } catch {
      // If reading fails, proceed with default count
    }

    await setDoc(
      docRef,
      {
        id: docId,
        name: trimmedName,
        local_type: data.local_type || existingData?.local_type || 'fisico',
        category: data.category || existingData?.category || 'Geral',
        subcategory: data.subcategory ?? existingData?.subcategory ?? '',
        budget_group: data.budget_group || existingData?.budget_group || 'essencial',
        type: data.type || existingData?.type || 'saida',
        last_description: data.description || existingData?.last_description || '',
        count: currentCount,
        last_used: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Registro de local não concluído:', err);
  }
}

// Subscribe to saved locals in real-time
export function subscribeSavedLocals(
  onData: (locals: SavedLocal[]) => void,
  onError: (err: any) => void = () => {}
): Unsubscribe {
  const firestore = getFirebaseDb();
  const localsRef = collection(firestore, 'locals');

  return onSnapshot(
    localsRef,
    (snapshot) => {
      const items: SavedLocal[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || '',
          local_type: (data.local_type as LocalType) || 'fisico',
          category: data.category || 'Geral',
          subcategory: data.subcategory || '',
          budget_group: (data.budget_group as BudgetGroup) || 'essencial',
          type: (data.type as TransactionType) || 'saida',
          last_description: data.last_description || '',
          count: data.count || 1,
          last_used: data.last_used || ''
        };
      });

      // Sort by highest frequency (count) and most recent usage
      items.sort((a, b) => (b.count - a.count) || b.last_used.localeCompare(a.last_used));
      onData(items);
    },
    (err) => {
      console.warn('Erro na sincronização de locais salvos:', err);
      onError(err);
    }
  );
}

// Sync existing transactions to locals database if they aren't registered yet
export async function syncExistingTransactionsToLocals(transactions: Transaction[]): Promise<void> {
  if (!transactions || transactions.length === 0) return;

  const map: Record<string, {
    name: string;
    local_type: LocalType;
    category: string;
    subcategory?: string;
    budget_group: BudgetGroup;
    type?: TransactionType;
    description?: string;
    last_used: string;
  }> = {};

  for (const tx of transactions) {
    if (!tx.local_name || !tx.local_name.trim()) continue;
    const name = tx.local_name.trim();
    const key = name.toLowerCase();
    if (!map[key]) {
      map[key] = {
        name,
        local_type: tx.local_type || 'fisico',
        category: tx.category || 'Geral',
        subcategory: tx.subcategory || '',
        budget_group: tx.budget_group || 'essencial',
        type: tx.type || 'saida',
        description: tx.description || '',
        last_used: tx.date || new Date().toISOString()
      };
    } else if (tx.date && tx.date > map[key].last_used) {
      map[key].last_used = tx.date;
      map[key].category = tx.category || map[key].category;
      map[key].budget_group = tx.budget_group || map[key].budget_group;
      map[key].local_type = tx.local_type || map[key].local_type;
      map[key].description = tx.description || map[key].description;
    }
  }

  for (const item of Object.values(map)) {
    recordLocalUsage({
      name: item.name,
      local_type: item.local_type,
      category: item.category,
      subcategory: item.subcategory,
      budget_group: item.budget_group,
      type: item.type,
      description: item.description
    }).catch(() => {});
  }
}

// Add Transaction
export async function addTransaction(transaction: Omit<Transaction, 'id'>): Promise<string> {
  const firestore = getFirebaseDb();
  const path = 'transactions';
  try {
    const txRef = collection(firestore, path);
    const docRef = await addDoc(txRef, {
      ...transaction,
      created_at: new Date().toISOString()
    });

    // Automatically feed the locals database in background
    recordLocalUsage({
      name: transaction.local_name,
      local_type: transaction.local_type,
      category: transaction.category,
      subcategory: transaction.subcategory,
      budget_group: transaction.budget_group,
      type: transaction.type,
      description: transaction.description
    }).catch(() => {});

    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

// Update Transaction
export async function updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
  const firestore = getFirebaseDb();
  const path = `transactions/${id}`;
  try {
    const docRef = doc(firestore, 'transactions', id);
    const { id: _, ...dataToUpdate } = updates;
    await updateDoc(docRef, {
      ...dataToUpdate,
      updated_at: new Date().toISOString()
    });

    // If local was updated, refresh the locals database
    if (updates.local_name) {
      recordLocalUsage({
        name: updates.local_name,
        local_type: updates.local_type,
        category: updates.category,
        subcategory: updates.subcategory,
        budget_group: updates.budget_group,
        type: updates.type,
        description: updates.description
      }).catch(() => {});
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// Delete Transaction
export async function deleteTransaction(id: string): Promise<void> {
  const firestore = getFirebaseDb();
  const path = `transactions/${id}`;
  try {
    const docRef = doc(firestore, 'transactions', id);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Fetch all Categories
export async function fetchCategories(): Promise<Category[]> {
  const firestore = getFirebaseDb();
  const path = 'categories';
  try {
    const catRef = collection(firestore, path);
    const snapshot = await getDocs(catRef);
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Category, 'id'>)
    }));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

// Real-time Monthly Budgets listener
export function subscribeMonthlyBudgets(
  onData: (budgets: MonthlyBudget[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const firestore = getFirebaseDb();
  const budgetsRef = collection(firestore, 'budgets');
  const q = query(budgetsRef, orderBy('month', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: MonthlyBudget[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          month: data.month || docSnap.id,
          total_expense_limit: Number(data.total_expense_limit) || 0,
          expected_income: Number(data.expected_income) || 0,
          group_limits: {
            essencial: Number(data.group_limits?.essencial) || 0,
            investimento: Number(data.group_limits?.investimento) || 0,
            educacao: Number(data.group_limits?.educacao) || 0,
            lazer: Number(data.group_limits?.lazer) || 0,
            adicional: Number(data.group_limits?.adicional) || 0
          },
          notes: data.notes || '',
          updated_at: data.updated_at
        };
      });
      onData(items);
    },
    (err) => {
      console.error('Erro na sincronização de orçamentos:', err);
      onError(err);
    }
  );
}

// Save Monthly Budget (Upsert by month YYYY-MM)
export async function saveMonthlyBudget(budget: Omit<MonthlyBudget, 'id'> & { id?: string }): Promise<string> {
  const firestore = getFirebaseDb();
  const monthId = budget.month;
  const path = `budgets/${monthId}`;
  try {
    const docRef = doc(firestore, 'budgets', monthId);
    const payload = {
      month: budget.month,
      total_expense_limit: Number(budget.total_expense_limit) || 0,
      expected_income: Number(budget.expected_income) || 0,
      group_limits: {
        essencial: Number(budget.group_limits.essencial) || 0,
        investimento: Number(budget.group_limits.investimento) || 0,
        educacao: Number(budget.group_limits.educacao) || 0,
        lazer: Number(budget.group_limits.lazer) || 0,
        adicional: Number(budget.group_limits.adicional) || 0
      },
      notes: budget.notes || '',
      updated_at: new Date().toISOString()
    };
    await setDoc(docRef, payload, { merge: true });
    return monthId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Delete Monthly Budget
export async function deleteMonthlyBudget(monthId: string): Promise<void> {
  const firestore = getFirebaseDb();
  const path = `budgets/${monthId}`;
  try {
    const docRef = doc(firestore, 'budgets', monthId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}
