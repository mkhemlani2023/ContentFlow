/**
 * Environment Configuration Function
 * Provides Supabase configuration to the frontend via environment variables
 */

exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*'
    },
    body: `window.ENV = {
      SUPABASE_URL: '${process.env.SUPABASE_URL || ''}',
      SUPABASE_ANON_KEY: '${process.env.SUPABASE_ANON_KEY || ''}'
    };`
  };
};
