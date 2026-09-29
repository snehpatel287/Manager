// Serialises documents in the shape the Next app expects (lib/types.ts):
// `_id` becomes a string `id`, internal fields are dropped.

export function toJSONPlugin(schema, { hide = [] } = {}) {
  schema.set('toJSON', {
    versionKey: false,
    transform(_doc, ret) {
      ret.id = String(ret._id);
      delete ret._id;
      for (const key of hide) delete ret[key];
      return ret;
    },
  });
}
