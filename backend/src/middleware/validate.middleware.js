module.exports = (schema, source = "body") => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) return next(result.error);
  // In Express 5 `req.query` is a getter, so assigning to it is ignored.
  if (source === "query") req.validatedQuery = result.data;
  else req[source] = result.data;
  next();
};
