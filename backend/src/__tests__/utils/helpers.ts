import 'reflect-metadata';
import request from 'supertest';
import { Container } from 'typedi';
import { App } from '@/app';
import prisma from '@/database';
import AppRoutes from '@/routes';
import { OperatorService } from '@/services/operator.service';

export const PASSWORD = 'mot-de-passe-solide';
export const app = new App(AppRoutes).getServer();
export const api = () => request(app);

export async function resetDatabase() {
  await prisma.$executeRawUnsafe('TRUNCATE operators, login_attempts RESTART IDENTITY CASCADE');
}

let counter = 0;

export async function login(email: string, password = PASSWORD) {
  const res = await api().post('/api/internal/auth/login').send({ email, password });
  if (res.status !== 200) throw new Error(`login failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body as { tokenData: { access: { token: string }; refresh: { token: string } }; user: any };
}

/** Creates an operator with its parking and manager, and logs the manager in. */
export async function setupOperator(name = 'Parking Test') {
  counter += 1;
  const created = await Container.get(OperatorService).createWithManager({
    operatorName: `${name} ${counter}`,
    parkingName: `${name} LYS`,
    totalCapacity: 200,
    managerName: 'Gérant Test',
    managerEmail: `gerant${counter}@example.com`,
    managerPassword: PASSWORD,
  });
  const session = await login(created.manager.email);
  return { ...created, token: session.tokenData.access.token, session };
}

/** Adds a staff member through the API and logs them in. */
export async function addStaff(managerToken: string, role: string) {
  counter += 1;
  const email = `${role}${counter}@example.com`;
  const res = await api()
    .post('/api/internal/staff')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({ name: `${role} ${counter}`, email, role, password: PASSWORD });
  if (res.status !== 201) throw new Error(`addStaff failed: ${res.status} ${JSON.stringify(res.body)}`);
  const session = await login(email);
  return { id: res.body.data.id as string, email, token: session.tokenData.access.token, session };
}
