import 'reflect-metadata';
import { parseArgs } from 'util';
import { Container } from 'typedi';
import prisma from '@/database';
import { namesFromArgs } from '@/domain/staff-name';
import { OperatorService } from '@/services/operator.service';

// Usage: npm run seed:operator -- --operator "Parking X" --parking "Parking X LYS" --capacity 300 \
//   --first-name Jean --last-name Dupont --email jean@example.com --password "un-mot-de-passe"
// (--name "Jean Dupont" is still accepted: split at its first space.)
const { values } = parseArgs({
  options: {
    operator: { type: 'string' },
    parking: { type: 'string' },
    capacity: { type: 'string' },
    'first-name': { type: 'string' },
    'last-name': { type: 'string' },
    name: { type: 'string' },
    email: { type: 'string' },
    password: { type: 'string' },
  },
});

async function main() {
  const { operator, capacity, name, email, password } = values;
  if (!operator || !capacity || !email || !password) {
    throw new Error('Required: --operator --capacity --first-name --last-name --email --password (and optionally --parking)');
  }
  const manager = namesFromArgs({ firstName: values['first-name'], lastName: values['last-name'], name });
  if (password.length < 10) throw new Error('The password must be at least 10 characters long');
  const totalCapacity = Number(capacity);
  if (!Number.isInteger(totalCapacity) || totalCapacity <= 0) throw new Error('--capacity must be a positive integer');

  const result = await Container.get(OperatorService).createWithManager({
    operatorName: operator,
    parkingName: values.parking ?? operator,
    totalCapacity,
    managerFirstName: manager.firstName,
    managerLastName: manager.lastName,
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
