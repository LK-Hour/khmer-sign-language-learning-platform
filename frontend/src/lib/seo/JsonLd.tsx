/** A JSON-LD document: an object whose keys are Schema.org properties. */
export type JsonLdData = Record<string, unknown>;

/**
 * Renders a JSON-LD structured-data block. Kept as a server component so the
 * script is present in the initial HTML that crawlers read.
 */
export default function JsonLd({ data }: { data: JsonLdData }) {
  return (
    <script
      type="application/ld+json"
      // Only trusted, app-derived values are serialized here. `<` is escaped so
      // the JSON payload cannot break out of the <script> element.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
