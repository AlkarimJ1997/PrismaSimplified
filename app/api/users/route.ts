import prisma from '@/lib/prisma';

type Body = {
	name: string;
	email: string;
	age: number;
};

export async function GET() {
	const user = await prisma.user.findMany({
		where: {
			name: 'Sally',
		},
		orderBy: { age: 'asc' },
		take: 2,
		skip: 1,
	});

	return new Response(JSON.stringify(user));
}

export async function POST() {
	await prisma.user.deleteMany();

	await prisma.user.create({
		data: {
			name: 'Kyle',
			email: 'kyle@test.com',
			age: 25,
		},
	});

	await prisma.user.create({
		data: {
			name: 'Sally',
			email: 'sally@test.com',
			age: 12,
		},
	});

	await prisma.user.create({
		data: {
			name: 'Sally',
			email: 'sally@test1.com',
			age: 13,
		},
	});

	return new Response(JSON.stringify({ message: 'Users created' }));
}
