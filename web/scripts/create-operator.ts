import "dotenv/config";
import { parseArgs } from "node:util";
import { createDb } from "../src/db/client";
import { operatorSetupSchema } from "../src/domain/validation";
import { createOperatorWithManager } from "../src/server/services/operators";

// Usage: pnpm seed:operator --operator "Parking X" --parking "Parking X LYS" --capacity 300 \
//   --name "Jean Dupont" --email jean@example.com --password "un-mot-de-passe"
const { values } = parseArgs({
  options: {
    operator: { type: "string" },
    parking: { type: "string" },
    capacity: { type: "string" },
    name: { type: "string" },
    email: { type: "string" },
    password: { type: "string" },
  },
});

const input = operatorSetupSchema.parse({
  operatorName: values.operator,
  parkingName: values.parking ?? values.operator,
  totalCapacity: values.capacity,
  managerName: values.name,
  managerEmail: values.email,
  managerPassword: values.password,
});

const { db, sql } = createDb(process.env.DATABASE_URL!);
createOperatorWithManager(db, input)
  .then(({ operator, parking, manager }) => {
    console.log(`Opérateur « ${operator.name} » créé (parking « ${parking.name} », ${parking.totalCapacity} places).`);
    console.log(`Compte gérant : ${manager.email}`);
  })
  .finally(() => sql.end());
