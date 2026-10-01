import 'reflect-metadata';
import { parseArgs } from 'util';
import { Container } from 'typedi';
import prisma from '@/database';
import { OperatorService } from '@/services/operator.service';

// Usage: npm run seed:operator -- --operator "Parking X" --parking "Parking X LYS" --capacity 300 \
//   --name "Jean Dupont" --email jean@example.com --password "un-mot-de-passe"
const { values } = parseArgs({
  options: {
    operator: { type: 'string' },
    parking: { type: 'string' },
    capacity: { type: 'string' },
    name: { type: 'string' },
    email: { type: 'string' },
    password: { type: 'string' },
  },
});

async function main() {
  const { operator, capacity, name, email, password } = values;
  if (!operator || !capacity || !name || !email || !password) {
    throw new Error('Required: --operator --capacity --name --email --password (and optionally --parking)');
  }
  if (password.length < 10) throw new Error('The password must be at least 10 characters long');
  const totalCapacity = Number(capacity);
  if (!Number.isInteger(totalCapacity) || totalCapacity <= 0) throw new Error('--capacity must be a positive integer');

  const result = await Container.get(OperatorService).createWithManager({
    operatorName: operator,
    parkingName: values.parking ?? operator,
    totalCapacity,
    managerName: name,
    managerEmail: email,
    managerPassword: password,
  });
  console.log(`Opérateur « ${result.operator.name} » créé (parking « ${result.parking.name} », ${result.parking.totalCapacity} places).`);
  console.log(`Compte gérant : ${result.manager.email}`);
}

main()
  .catch(error => {
    console.error(error.message ?? error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
