// Fake API layer for frontend testing (until backend is connected)

export async function apiGet(endpoint: string) {
        console.log("GET → " + endpoint);
      
        // Simulate delay
        await new Promise((res) => setTimeout(res, 300));
      
        return { success: true };
      }
      
      export async function apiPost(endpoint: string, body: any) {
        console.log("POST → " + endpoint, body);
      
        // Simulate delay
        await new Promise((res) => setTimeout(res, 300));
      
        return { success: true };
      }
      