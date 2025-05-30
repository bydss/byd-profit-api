import sql from '../config/database.js';

export const createTable = async (tableName, schema) => {
  try {
    await sql.unsafe(schema);
    console.log(`Table ${tableName} created successfully`);
  } catch (error) {
    console.error(`Error creating table ${tableName}:`, error);
    throw error;
  }
};

export const dropTable = async (tableName) => {
  try {
    await sql`DROP TABLE IF EXISTS ${sql(tableName)} CASCADE`;
    console.log(`Table ${tableName} dropped successfully`);
  } catch (error) {
    console.error(`Error dropping table ${tableName}:`, error);
    throw error;
  }
};

export const tableExists = async (tableName) => {
  try {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = ${tableName}
      )
    `;
    return result[0].exists;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    throw error;
  }
}; 