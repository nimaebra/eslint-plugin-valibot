import { literal, object, string, union } from 'valibot';

const User = object({
  id: string(),
});

const EventSchema = union([
  object({ type: literal('created'), id: string() }),
  object({ type: literal('updated'), id: string() }),
]);

const StatusSchema = union([literal('active'), literal('inactive')]);

export { EventSchema, StatusSchema, User };
