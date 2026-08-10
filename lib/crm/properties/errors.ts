export class PropertyTypeInUseError extends Error {
  code = "PROPERTY_TYPE_IN_USE" as const;

  constructor(message = "Field type cannot be changed after this property has stored values.") {
    super(message);
    this.name = "PropertyTypeInUseError";
  }
}
