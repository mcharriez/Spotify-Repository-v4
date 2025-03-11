import { createClient } from "@supabase/supabase-js";

// Use the exact values provided by the user
const supabaseUrl = "https://omrlnwtllgadxbxfymgg.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tcmxud3RsbGdhZHhieGZ5bWdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzODc1NDIsImV4cCI6MjA1Njk2MzU0Mn0.wcIAkPy2LS-iWvBn0hBmrL3oqcuDsJSpqAXYGD9_R0s";

console.log("Initializing Supabase client with fixed values");

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
