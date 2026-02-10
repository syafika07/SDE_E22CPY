import { Injectable } from '@angular/core';
import { supabase } from './supabaseClient';
import { BehaviorSubject } from 'rxjs';
import { User } from '@supabase/supabase-js';
import { NGXLogger } from 'ngx-logger';



    // DI LETAK DI DALAM class TngPagec { ... }
  const fareTable: any = {
    "1": { // Class 1
      "201": { "202": 4.50, "203": 9.20, "204": 13.50 },
      "202": { "201": 4.50, "203": 5.60, "204": 9.90 },
      "203": { "201": 9.20, "202": 5.60, "204": 7.20 },
      "204": { "201": 13.50, "202": 9.90, "203": 7.20 }
    },
    "2": { // Class 2
      "201": { "202": 6.80, "203": 13.80, "204": 20.20 },
      "202": { "201": 6.80, "203": 8.50, "204": 14.90 },
      "203": { "201": 13.80, "202": 8.50, "204": 10.80 },
      "204": { "201": 20.20, "202": 14.90, "203": 10.80 }
    },
    "3": { // Class 3
      "201": { "202": 9.00, "203": 18.40, "204": 27.00 },
      "202": { "201": 9.00, "203": 11.30, "204": 19.90 },
      "203": { "201": 18.40, "202": 11.30, "204": 14.40 },
      "204": { "201": 27.00, "202": 19.90, "203": 14.00 }
    },
    "4": { // Class 4 (Taxi)
      "201": { "202": 2.30, "203": 4.60, "204": 6.80 },
      "202": { "201": 2.30, "203": 2.80, "204": 5.00 },
      "203": { "201": 4.60, "202": 2.80, "204": 3.60 },
      "204": { "201": 6.80, "202": 5.00, "203": 3.60 }
    },
    "5": { // Class 5 (Bus)
      "201": { "202": 2.80, "203": 5.70, "204": 8.40 },
      "202": { "201": 2.80, "203": 3.50, "204": 6.20 },
      "203": { "201": 5.70, "202": 3.50, "204": 4.50 },
      "204": { "201": 8.40, "202": 6.20, "203": 4.50 }
    }
  };

interface Profile {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at?: string;
}
export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: string;
}
@Injectable({
  providedIn: 'root'
})


export class SupabaseService {
  // 🔹 Reactive user state
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(private logger: NGXLogger) {
    this.logger.debug('AppComponent initialized');
    this.loadCurrentUser();

  }

  // 🔹 Load current user dari Supabase (on app init)
  async loadCurrentUser() {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        this.logger.error('loadCurrentUser error:', error.message);
        this.userSubject.next(null);
      } else {
        this.userSubject.next(data.user ?? null);
      }
    } catch (err) {
      this.logger.error('Exception loadCurrentUser:', err);
      this.userSubject.next(null);
    }
  }

  // 🔹 Legacy getUser() supaya file lama compatible
  async getUser(): Promise<User | null> {
    let user = this.userSubject.value;

    // Jika belum ada, load dari Supabase
    if (!user) {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          this.logger.error('getUser error:', error.message);
          return null;
        }
        user = data.user ?? null;
        this.userSubject.next(user);
      } catch (err) {
        this.logger.error('getUser exception:', err);
        return null;
      }
    }

    return user;
  }

  // 🔹 Log masuk
async signIn(email: string, password: string): Promise<User> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error('Login gagal: akaun tak jumpa');
  this.userSubject.next(data.user);
  return data.user;
}


  // 🔹 Log keluar
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    this.userSubject.next(null);
  }

  // 🔹 Dapatkan profile user
  async getProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name, role')
        .eq('id', userId)
        .single();

      if (error) {
        this.logger.warn('getProfile error:', error.message);
        return null;
      }
      return data;
    } catch (err) {
      this.logger.error('getProfile exception:', err);
      return null;
    }
  }

  // 🔹 Cipta profile manual
  async createProfile(userId: string, email: string, name: string, role: string = 'user') {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([{ id: userId, email, name, role, created_at: new Date() }])
        .select()
        .single();

      if (error) {
        this.logger.error('createProfile error:', error.message);
        return null;
      }
      return data;
    } catch (err) {
      this.logger.error('Exception createProfile:', err);
      return null;
    }
  }

async signUp(email: string, password: string, name: string, role: string): Promise<AppUser | null> {
  this.logger.debug('Starting signUp for', email);

  try {
    // 1️⃣ Daftar akaun Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role },
        emailRedirectTo: undefined
      }
    });

    if (error) {
      this.logger.error('Supabase auth.signUp error:', error.message);
      throw error;
    }

    if (!data.user) {
      this.logger.error('signUp failed: user object not returned');
      throw new Error('Login gagal: akaun tak dijumpai');
    }

    this.logger.debug('Supabase user created:', data.user.id);

    // 2️⃣ Insert ke table profiles
    try {
      const profile = await this.createProfile(data.user.id, email, name, role);
      if (!profile) {
        this.logger.warn('createProfile returned null. Check RLS or table schema.');
      } else {
        this.logger.debug('Profile created successfully:', profile);
      }
    } catch (profileErr: any) {
      this.logger.error('createProfile failed:', profileErr);
    }

    // 3️⃣ Return AppUser object
    const appUser: AppUser = {
      id: data.user.id,
      email,
      name,
      role
    };

    return appUser;

  } catch (err: any) {
    this.logger.error('signUp exception:', err);
    throw err; // biar page handle error
  }
}

  async updateUserProfile(userId: string, newPassword: string, role: string) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);

    if (profileError) throw profileError;

    if (newPassword) {
      const { error: pwError } = await supabase.auth.admin.updateUserById(userId, { password: newPassword });
      if (pwError) throw pwError;
    }
  }

  async updateFullUser(userId: string, updates: { email: string; name: string; role?: string }) {
    const updateData: any = { email: updates.email, name: updates.name };
    if (updates.role) updateData.role = updates.role;

    const { error: profileError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (profileError) throw profileError;
    return updateData;
  }

  // 🔹 Update role sahaja
  async updateUserRole(id: string, updatedData: { role: string }) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updatedData)
      .eq('id', id)
      .select();

    this.logger.debug('updateUserRole debug', { id, updatedData, data, error });
    return { data, error };
  }

  // 🔹 Dapat semua profiles
  async getAllProfiles() {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) throw error;
    return data;
  }

  async getAllUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, name, role, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error('Error getAllUsers:', error);
      return { data: [], error };
    }
    return { data, error: null };
  }

  // 🔹 Current session
  async getCurrentSession() {
    return await supabase.auth.getSession();
  }

  // 🔹 Tambah di akhir class SupabaseService
public emitUser(user: User | null) {
  this.userSubject.next(user);
}


// 🔹 Simpan perubahan EntryPlaza / Fare / Remark ke Supabase
async updateTrafficRow(payload: {
  trxno: string;
  entry_plaza: string;
  paid_amount: number;
  fare_amount: number;
  remark: string;
  updated_by: string;
}) {
  try {
    const { data, error } = await supabase
      .from('traffic_updates')
      .upsert(payload) // guna UPSERT untuk overwrite kalau row sama
      .select()
      .single();

    if (error) {
      this.logger.error('updateTrafficRow error:', error.message);
      throw error;
    }

    this.logger.debug('updateTrafficRow success:', data);
    return data;

  } catch (err) {
    this.logger.error('updateTrafficRow exception:', err);
    throw err;
  }
}

async getAllEntryPlazas(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('transactions')   // ganti dengan nama table sebenar
      .select('EntryPlaza')
      .neq('EntryPlaza', null);

    if (error) {
      this.logger.error('getAllEntryPlazas error:', error.message);
      return [];
    }

    // cast data ke array of objects dengan properti EntryPlaza
    const plazas = (data as { EntryPlaza: string }[])
      .map(row => row.EntryPlaza);

    // dapatkan senarai unik sahaja
    const uniquePlazas = Array.from(new Set(plazas));

    return uniquePlazas;
  } catch (err) {
    this.logger.error('getAllEntryPlazas exception:', err);
    return [];
  }
}

async updateTransactionInDB(row: any) {
    if (!row.id) return;

    try {
      let newRemark = row.Remark || '';
      const editedIndex = newRemark.indexOf('EDITED!!');
      if (editedIndex !== -1) {
        newRemark = newRemark.replace(/EDITED!!.*$/, `EDITED!! ${new Date().toLocaleString()}`);
      } else {
        newRemark = `${newRemark} | EDITED!! ${new Date().toLocaleString()}`;
      }

      let newPaidAmount = row.PaidAmount;
      const classType = row.Trx?.toString();
      if (fareTable[classType] && row.EntryPlaza && row.PlazaNo) {
        const entry = row.EntryPlaza.toString();
        const plaza = row.PlazaNo.toString();
        if (fareTable[classType][entry] && fareTable[classType][entry][plaza] != null) {
          newPaidAmount = fareTable[classType][entry][plaza];
        }
      }

      const { data, error } = await supabase
        .from('sde22')
        .update({
          EntryPlaza: row.EntryPlaza === 'NULL' ? null : row.EntryPlaza,
          Remark: newRemark,
          PaidAmount: newPaidAmount
        })
        .eq('id', row.id);

      if (error) throw error;

      return { data, updatedRow: { ...row, Remark: newRemark, PaidAmount: newPaidAmount } };

    } catch (err) {
      console.error('updateTransactionInDB error:', err);
      throw err;
    }
  }
}


