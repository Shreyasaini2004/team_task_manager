import app from './app.js';
import { connectDatabase } from './config/db.js';

const port = process.env.PORT || 4000;

connectDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Task Harbor API running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start server');
    console.error(error);
    process.exit(1);
  });
