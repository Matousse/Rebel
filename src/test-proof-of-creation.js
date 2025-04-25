const axios = require('axios');
const API_URL = 'http://localhost:5001/api';

async function diagnoseAPI() {
  try {
    console.log('=== DIAGNOSTIC API ===');
    
    // 1. Test de connexion de base
    console.log('1. Test de connexion à l\'API...');
    try {
      const rootResponse = await axios.get(API_URL);
      console.log('✅ Connexion réussie:', rootResponse.status);
    } catch (error) {
      console.error('❌ Échec de connexion:', error.message);
    }
    
    // 2. Authentification Magic
    console.log('\n2. Test d\'authentification Magic...');
    const magicToken = 'WyIweDVhNDFiMWRiNmIyNjU5M2JmMDAyZDU0ZmZlMTI2NzczMjJkY2EzMGI5YzU0YWZhNDg1YWYyNzhhMDA5ZmIxNmYwYjhlZDQ1MmYwOGRjNzBlMjU3NzczNmIwYThmOTA1NGJkZjRkZWE5NWVjMzk3YzA3YjViNzE5ZmFiNDI3YTc2MWMiLCJ7XCJpYXRcIjoxNzQ1NjAzMTA2LFwiZXh0XCI6MTc0NTYwNDAwNixcImlzc1wiOlwiZGlkOmV0aHI6MHg2ODIyNDNlM0Q4ZTdjOThmYjI3ZkFEMTE2NDg1MTBhODViMDQ3NjYxXCIsXCJzdWJcIjpcIi1MbUhRRE5renNEWlJ2THNaSHZENjNNcUFmRXgtTFZGbjIydVAzT1M2YW89XCIsXCJhdWRcIjpcIlJhU0ZjZk5GSUhoR1J1aHFXaDVDT21QYjJGZGxLMGg4MEpBVU9vWlFhX0k9XCIsXCJuYmZcIjoxNzQ1NjAzMTA2LFwidGlkXCI6XCI3YWIwZDIwYi03OTdkLTRlMzAtOTFlNC00MTdhMTgxNzM3YTJcIixcImFkZFwiOlwiMHg2ODE2YjFiZWQ3NmY5MzEwYmY4ZDAzMGE1OTgzZGM4YzhmOWEyNDNkZGJhNjIyNDJhNjEzMDc4MzNiYWYzM2Y0NTZkOGE1YmEyOTNmMWM5MWUwZmFkNmRlMzAwZTAwY2Q1OTE5NzRjMDdlMTg1NzQ5NTJkZDc4ZmNjNWI0OGIwNzFiXCJ9Il0='; // Remplacez par votre token
    try {
      const authResponse = await axios.post(`${API_URL}/magic/auth`, {
        didToken: magicToken,
        username: `test_user_${Date.now()}`
      });
      
      console.log('✅ Authentification réussie:', authResponse.status);
      const jwtToken = authResponse.data.token;
      
      // 3. Test d'accès à un endpoint protégé simple
      console.log('\n3. Test d\'accès à un endpoint protégé (profil)...');
      try {
        const profileResponse = await axios.get(`${API_URL}/users/profile`, {
          headers: { 'Authorization': `Bearer ${jwtToken}` }
        });
        console.log('✅ Accès au profil réussi:', profileResponse.status);
      } catch (error) {
        console.error('❌ Échec d\'accès au profil:', error.response?.status, error.response?.data || error.message);
      }
      
      // 4. Lister les endpoints disponibles (si disponible)
      console.log('\n4. Tentative de lister les routes disponibles...');
      try {
        const routesResponse = await axios.get(`${API_URL}/routes`, {
          headers: { 'Authorization': `Bearer ${jwtToken}` }
        });
        console.log('✅ Routes disponibles:', routesResponse.data);
      } catch (error) {
        console.log('ℹ️ Pas d\'endpoint pour lister les routes ou accès refusé');
      }
    } catch (authError) {
      console.error('❌ Échec d\'authentification:', authError.response?.status, authError.response?.data || authError.message);
    }
  } catch (error) {
    console.error('Erreur générale:', error.message);
  }
}

diagnoseAPI();