"use client";

import { useEffect, useState } from "react";

const ApiUrlTestPage = () => {
  const [apiBaseUrl, setApiBaseUrl] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    // Display the environment variable value
    setApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
    
    // Try a direct fetch to test API connectivity
    const testApi = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/users', {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error(`Failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Direct fetch successful:', data);
      } catch (error) {
        console.error('Direct fetch failed:', error);
      }
    };
    
    testApi();
  }, []);
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">API URL Test</h1>
      <p>Current NEXT_PUBLIC_API_BASE_URL: {apiBaseUrl || 'Not set'}</p>
      <p>Check the browser console for direct fetch results.</p>
    </div>
  );
};

export default ApiUrlTestPage; 