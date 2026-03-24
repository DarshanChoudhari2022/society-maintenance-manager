const { Client } = require('pg');

const run = async () => {
  const url1 = "postgresql://postgres.uvzlanyagtkqsjybxgco:Bliss%408605589062@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";
  const url2 = "postgresql://postgres:Bliss%408605589062@db.uvzlanyagtkqsjybxgco.supabase.co:5432/postgres";
  const url3 = "postgresql://postgres.uvzlanyagtkqsjybxgco:Bliss@8605589062@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";
  
  for (const [i, connectionString] of [url1, url2].entries()) {
    console.log(`Trying URL ${i + 1}...`);
    const client = new Client({ connectionString });
    try {
      await client.connect();
      console.log(`URL ${i + 1} SUCCESS!`);
      const res = await client.query('SELECT NOW()');
      console.log(res.rows[0]);
      await client.end();
      return; // Exit on success
    } catch (e) {
      console.error(`URL ${i + 1} FAILED:`, e.message);
    }
  }
};

run();
