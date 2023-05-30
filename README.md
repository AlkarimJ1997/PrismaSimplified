This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Prisma Simplified

This repository is a guide to help you get started with Prisma. It covers all the basics of Prisma and how to use it with Next.js. It's built on top of `TypeScript` and `Next.js`.

## Getting Started with Prisma

To get started with `Prisma`, we need to install some dependencies. We will be using `PostgreSQL` as our database.

```bash
npm install prisma --save-dev
npm install @prisma/client
```

Next, we need to initialize `Prisma` in our project. To do that, we need to run the following command:

```bash
npx prisma init
```

This will create a `prisma` folder in our project. Inside the `prisma` folder, we will have a `schema.prisma` file. This file is where we will define our database schema.

To actually utilize `prisma`, you need a created database already setup. You can use any database you want, but for this tutorial, we will be using `sqlite` for simplicity.

We have to adjust our `schema.prisma` file to use `sqlite` instead of `postgresql`.

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

This just says to create a `sqlite` database in the `prisma` folder called `dev.db`.

## Creating a Model

Now that we have our database setup, we can create a model. A model is just a table in our database. We can create a model by adding the following to our `schema.prisma` file.

```prisma
model User {
  id   Int    @id @default(autoincrement())
  name String
}
```

Here, we are creating one of the most basic models. It has an `id` and a `name`. The `id` is an `Int` and is the primary key of the table. 

We use the `@id` attribute to specify that this is the primary key. 
We use the `@default(autoincrement())` attribute to specify an autoincrementing field. 
The `name` is a `String` and is just a normal field.

Now, by default, changes to our `schema.prisma` file are not reflected in our database. We have to run the following command to update our database.

```bash
npx prisma migrate dev --name init
```

Now, before actually utilizing our model, we need to generate our `Prisma Client`. In a Next.js project, we'd instantiate our `Prisma Client` in `lib/prisma.ts` and then, we'd use our `Prisma Client` in our `pages/api` folder and use `fetch` or `axios` to make requests to our `api`.

```ts
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
```

```ts
// pages/api/users/route.ts
import prisma from '@/lib/prisma';

export async function GET() {
  const users = await prisma.user.findMany();

  return new Response(JSON.stringify(users));
}

export async function POST() {
	const user = await prisma.user.create({
		data: {
			name: 'Kyle',
		},
	});

	return new Response(JSON.stringify(user));
}
```

Note that we utilize the naming of `route.ts` here because it's a special name in `Next.js` for serverless API routes. You can read more about it [here](https://nextjs.org/docs/api-routes/introduction).

Finally, we'd use `fetch` or `axios` to make requests to our `api`.

```tsx
const Home = () => {
	useEffect(() => {
		fetch('/api/users')
			.then(res => res.json())
			.then(data => console.log(data));
	}, []);

	return <h1>Hello World</h1>;
}
```

## Model Fields

Now, let's talk about the different types of fields we can have in our model. We already saw the `Int` and `String` fields, but there are many more.

The syntax for creating fields in `Prisma` is as follows:

`<name> <type> <attributes>`

Let's look at the different types of fields we can have:

- `Int` - An integer field. Common defaults are `@id`, `@default(autoincrement())`, and `@default(uuid())`.
- `String` - A string field. Common defaults are `@unique`.
- `Boolean` - A boolean field. Common defaults are `@default(false)`.
- `BigInt` - A big integer field (for large numbers).
- `Float` - A floating point number field.
- `Decimal` - A decimal number field (for precise numbers).
- `DateTime` - A date and time field. Common defaults are `@default(now())`.
- `Json` - A JSON field for complex data. NOTE: This is not supported in SQLite.
- `Bytes` - A byte array field. Useful for files.
- `Unsupported("")` - A field that is not supported by `Prisma`.

Now, the most common thing to do with fields is create relationships between models. We can do this by using the `@relation` attribute.

```prisma
model User {
  id      String  @id @default(uuid())
  name    String
  email   String
  isAdmin Boolean
  posts   Post[]
}

model Post {
  id       String @id @default(uuid())
  rating   Float
  author   User   @relation(fields: [authorId], references: [id])
  authorId String
}
```

Here, we establish a one to many relationship between `User` and `Post`. A `User` can have many `Post`s, but a `Post` can only have one `User`. We do this by adding a `posts` field to our `User` model (which is an array) and a `author` field to our `Post` model.'

Now, what if we want the `User` to have two references to `Post`? Maybe a `User` can have written posts, but also favorited posts. We can do this like so:

```prisma
model User {
  id            String  @id @default(uuid())
  name          String
  email         String
  isAdmin       Boolean
  writtenPosts  Post[]  @relation("writtenPosts")
  favoritePosts Post[]  @relation("favoritePosts")
}

model Post {
  id            String @id @default(uuid())
  rating        Float
  author        User   @relation("writtenPosts", fields: [authorId], references: [id])
  authorId      String
  favoritedBy   User   @relation("favoritePosts", fields: [favoritedById], references: [id])
  favoritedById String
}
```

Notice that we must specify a name for each relationship with the `@relation` attribute. This is so that there's no ambiguity between the two relationships.

Now, what about a many to many relationship? Maybe posts can belong to many different `Category`s and `Category`s can have many different `Post`s. We can do this like so:

```prisma
model Post {
  id            String     @id @default(uuid())
  rating        Float
  author        User       @relation("writtenPosts", fields: [authorId], references: [id])
  authorId      String
  favoritedBy   User?      @relation("favoritePosts", fields: [favoritedById], references: [id])
  favoritedById String?
  categories    Category[]
}

model Category {
  id    String @id @default(uuid())
  posts Post[]
}
```

See the gotcha here? We don't have to do anything. All we do is make a reference to each other and `Prisma` will automatically create a join table for us. Awesome!

Finally, let's look at a one to one relationship. Maybe a `User` has a set of `UserPreference`s that say whether they want to receive emails or not. We can do this like so:

```prisma
model User {
  id             String          @id @default(uuid())
  name           String
  email          String
  isAdmin        Boolean
  writtenPosts   Post[]          @relation("writtenPosts")
  favoritePosts  Post[]          @relation("favoritePosts")
  userPreference UserPreference?
}

model UserPreference {
  id           String  @id @default(uuid())
  emailUpdates Boolean
  user         User    @relation(fields: [userId], references: [id])
  userId       String  @unique
}
```

Notice the `@unique` attribute on the `userId` field. This is because we want to ensure that there is only one `UserPreference` per `User`.

## Attributes

Like we did with the different fields, let's also breakdown the different attributes we can have on our fields.

- `@id` - This field is the primary key of the model.
- `@default(autoincrement())` - This field has a default value that is auto incremented.
- `@default(uuid())` - This field has a default value that is a `uuid`.
- `@default(now())` - This field has a default value of the current date and time.
- `@default(<value>)` - This field has a default value of `<value>`.
- `@unique` - This field is unique.
- `@relation(<name>, fields: [<fields>], references: [<fields>])` - This field is a relationship to another model. The `<name>` is the name of the relationship. The `<fields>` are the fields that are used to create the relationship. The `<references>` are the fields that are being referenced in the other model.
- `@map(<name>)` - This field is mapped to a different name in the database.
- `@ignore` - This field is ignored by `Prisma`.
- `@updatedAt` - This field is updated whenever the model is updated.

One more thing to talk about are block level attributes. These are attributes that are applied to the entire model. They are useful for when we want combining constraints. For example, what if we want our `age` and `name` fields in the `User` model to be unique together?

In other words, if two `User`s have the same `age` but different `name`s, that's fine. If two `User`s have the same `name` but different `age`s, that's fine. But if two `User`s have the same `name` and `age`, that's not fine. We can do this like so:

```prisma
model User {
  id      String  @id @default(uuid())
  name    String
  email   String
  isAdmin Boolean
  posts   Post[]

  @@unique([name, age])
}
```

Notice the use of `@@` to denote a block level attribute. Other useful block level attributes are `@@index` to say that a field is indexed for easier querying.

## Enums

Last bit of things we want to talk about are `enums`. `enums` are useful for when we want to have a field that can only have a certain set of values. For example, maybe we want a `User` to have a `role` that can only be `ADMIN` or `USER`. We can do this like so:

```prisma
enum Role {
  USER
  ADMIN
}

model User {
  id      String  @id @default(uuid())
  name    String
  email   String
  role    Role    @default(USER)
  posts   Post[]
}
```

Note that `enums` are not supported by `SQLite`.

## Creating Users in Prisma and Next JS

Now that we have our `Prisma` schema, let's create some `User`s in our `Next JS` app using serverless API routes.

```ts
export async function POST() {
	await prisma.user.deleteMany();

	const user = await prisma.user.create({
		data: {
			name: 'Kyle',
			email: 'kyle@test.com',
			age: 25,
			userPreference: {
				create: {
					emailUpdates: true,
				},
			},
		},
		select: {
			name: true,
			userPreference: true,
		},
	});

	return new Response(JSON.stringify(user));
}
```

Here, we are creating a new user using the `create()` method. We are also creating a `UserPreference` for that user using the `create` property. We are also using the `select` property to only return the `name` and `userPreference` fields.

If we wanted to create more than one `User` at a time, we can do that using the `createMany()` method and passing in an array of `User`s, but beware, **_this method is not supported by `SQLite`_**.

## Reading Users in Prisma and Next JS

Now that we have some `User`s, what about reading our database? Let's create a `GET` request to find a specific `User`.

```ts
export async function GET() {
	const user = await prisma.user.findUnique({
		where: {
			email: 'kyle@test.com',
		},
	});

	return new Response(JSON.stringify(user));
}
```

Here, we try to find a `User` with the email of `kyle@test.com`. We'll get back `null` if we can't find a `User` with that email. If we want to search for a `User` by a field that isn't unique, we can use the `findFirst()` method instead with the same syntax.

If we want to find multiple `User`s, we can use the `findMany()` method.

```ts
export async function GET() {
	const user = await prisma.user.findMany({
		where: {
			name: 'Sally',
		},
	});

	return new Response(JSON.stringify(user));
}
```

This will give back all `User`s with the name of `Sally`. We can also use `distinct` to only return unique `User`s.

```ts
export async function GET() {
	const user = await prisma.user.findMany({
		where: {
			name: 'Sally',
		},
		distinct: ['name'],
	});

	return new Response(JSON.stringify(user));
}
```

This says to return all `User`s with the name of `Sally`, but only return unique `name`s, which doesn't make much sense here, but you get the idea. It will only return one `User` with the name of `Sally` because we want distinct `name`s.

We could add `age` as well, and then it would return all `User`s with the name of `Sally` and different `age`s. This is because if you pass multiple fields, it will look at the combination of those fields to determine uniqueness.

If we want to return all `User`s, we can use the `findMany()` method without any arguments.

```ts
export async function GET() {
  const user = await prisma.user.findMany();

  return new Response(JSON.stringify(user));
}
```

Finally, if we want to do pagination and exclusion, we can use the `skip` and `take` properties.

```ts
export async function GET() {
	const user = await prisma.user.findMany({
		where: {
			name: 'Sally',
		},
		take: 2,
    skip: 1,
	});

	return new Response(JSON.stringify(user));
}
```

This says to return the first two users with the name of `Sally`, but skip the first one. In other words, return the second and third `User`s with the name of `Sally`. We can also use `orderBy` to order the results.

```ts
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
```

## Advanced Filtering

We can also do more advanced filtering using the `where` property. For example, let's say we want to find all `User`s that don't have the name of `Sally`.

```ts
export async function GET() {
  const user = await prisma.user.findMany({
    where: {
      name: { not: 'Sally' },
    },
  });

  return new Response(JSON.stringify(user));
}
```

If we want to find users that are `Sally` or `Kyle`, we can do that like so:

```ts
export async function GET() {
  const user = await prisma.user.findMany({
    where: {
      name: { in: ['Sally', 'Kyle'] },
    },
  });

  return new Response(JSON.stringify(user));
}
```

If we want to find users that are not `Sally` or `Kyle`, we can do that like so:

```ts
export async function GET() {
  const user = await prisma.user.findMany({
    where: {
      name: { notIn: ['Sally', 'Kyle'] },
    },
  });

  return new Response(JSON.stringify(user));
}
```

If we want to find users that are less than 25 years old, we can do that like so:

```ts
export async function GET() {
  const user = await prisma.user.findMany({
    where: {
      age: { lt: 25 },
    },
  });

  return new Response(JSON.stringify(user));
}
```

If we want to find users that are greater than or equal to 25 years old, we can do that like so:

```ts
export async function GET() {
  const user = await prisma.user.findMany({
    where: {
      age: { gte: 25 },
    },
  });

  return new Response(JSON.stringify(user));
}
```

If we want to filter the contents of strings, we can use the `contains` property. For example, let's get all users whose email contains `@test.com`.

```ts
export async function GET() {
  const user = await prisma.user.findMany({
    where: {
      email: { contains: '@test.com' },
    },
  });

  return new Response(JSON.stringify(user));
}
```

There are similar properties for `startsWith` and `endsWith`. Also, if we want to do two different checks on the same field, we can use the `AND` and `OR` properties.

```ts
export async function GET() {
  const user = await prisma.user.findMany({
    where: {
      AND: [
        { email: { startsWith: 'sally' } },
        { email: { endsWith: '@test1.com' } },
      ],
    },
  });

  return new Response(JSON.stringify(user));
}
```

This says to return all users whose email starts with `sally` and ends with `@test1.com`. For relationship filtering, we can do the following:

```ts
export async function GET() {
  const users = await prisma.user.findMany({
    where: {
      userPreference: {
        emailUpdates: true
      }
    }
  });

  return new Response(JSON.stringify(user));
}
```

This says to return all users whose `userPreference` has the `emailUpdates` property set to `true`. We can also do the following:

```ts
export async function GET() {
  const users = await prisma.user.findMany({
    where: {
      writtenPosts: {
        every: {
          title: { startsWith: 'My' }
        }
      }
    }
  });

  return new Response(JSON.stringify(user));
}
```

This says to return all users whose every `writtenPosts` have a `title` that starts with `My`. We can do similar things with `some` and `none`. Be careful with `every` and `none` because the logic is different than you might expect.

For example, if none of our users had any `writtenPosts`, then `every` and `none` would both return all users. This is because every user has no `writtenPosts`, so every user meets the criteria. If we used `some`, then it would return no users because no user has at least one `writtenPosts` that meets the criteria.

`is` and `isNot` are also useful for filtering. For example, let's say we want all the posts whose `author` is `Sally`.

```ts
export async function GET() {
  const posts = await prisma.post.findMany({
    where: {
      author: {
        is: {
          name: 'Sally'
        }
      }
    }
  });

  return new Response(JSON.stringify(posts));
}
```

## Updating in Prisma and Next JS

Updating in Prisma is very similar to creating. We can use the `update()` method to update a single record. For example, let's say we want to update the email of a user.

```ts
export async function UPDATE() {
  await prisma.user.update({
    where: {
      email: 'sally@test.com'
    },
    data: {
      email: 'sally@test3.com'
    }
  })

  return new Response(JSON.stringify({ message: 'User updated' }));
}
```

This finds the user with the email of `sally@test.com` and updates the email to `sally@test3.com`. We can also update multiple records at once using `updateMany()`. Be careful with uniqueness. For example, if you try to use `update()` on a field that isn't unique, it will throw an error because it doesn't know which record to update.

## Deleting in Prisma and Next JS

Deleting in Prisma is very simple and similar to creating and updating. We can use the `delete()` method to delete a single record. For example, let's say we want to delete a user.

```ts
export async function DELETE() {
  await prisma.user.delete({
    where: {
      email: 'kyle@test.com'
    }
  });

return new Response(JSON.stringify({ message: 'User deleted' }));
```

This finds the user with the email of `kyle@test.com` and deletes it. We can also delete multiple records at once using `deleteMany()`. Like with updating, if you try to use `delete()` on a field that isn't unique, it will throw an error because it doesn't know which record to delete.

## Request Body and Query Parameters

One last thing to cover is request body and query parameters. We can use these to pass data to our API. For example, let's say we want to create a user that isn't hardcoded. We can do that like so:

```ts
export async function POST(request: Request) {
  const body = await request.json();

  await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      age: body.age,
    },
  });

  return new Response(JSON.stringify({ message: 'User created' }));
}
```

Similarly, we can use query parameters to pass data to our API. For example, let's say we want to get a user by their email. We can do that like so:

```ts
export async function GET(request: Request) {
  const email = request.query.get('email');

  const user = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });

  return new Response(JSON.stringify(user));
}
```

This gets the email from the query parameters and uses it to find the user. We can also use query parameters to filter our data. For example, let's say we want to get all users whose email contains `@test.com`. We can do that like so:

```ts
export async function GET(request: Request) {
  const email = request.query.get('email');

  const user = await prisma.user.findMany({
    where: {
      email: { contains: email },
    },
  });

  return new Response(JSON.stringify(user));
}
```

To delete a user, we can do the following:

```ts
export async function DELETE(request: Request) {
  const id = request.query.get('id');

  await prisma.user.delete({
    where: {
      id: id,
    },
  });

  return new Response(JSON.stringify({ message: 'User deleted' }));
}
```