import { Embeddings, EmbeddingsParams } from "@langchain/core/embeddings";

/**
 * A class that provides fake embeddings by overriding the embedDocuments
 * and embedQuery methods to return fixed values.
 */
export class FakeEmbeddings extends Embeddings {
  constructor(params?: EmbeddingsParams) {
    super(params ?? {});
  }

  /**
   * Generates fixed embeddings for a list of documents.
   * @param documents List of documents to generate embeddings for.
   * @returns A promise that resolves with a list of fixed embeddings for each document.
   */
  embedDocuments(documents: string[]): Promise<number[][]> {
    return Promise.resolve(documents.map(() => [0.1, 0.2, 0.3, 0.4]));
  }

  /**
   * Generates a fixed embedding for a query.
   * @param _ The query to generate an embedding for.
   * @returns A promise that resolves with a fixed embedding for the query.
   */
  embedQuery(_: string): Promise<number[]> {
    return Promise.resolve([0.1, 0.2, 0.3, 0.4]);
  }
}

/**
 * An interface that defines additional parameters specific to the
 * SyntheticEmbeddings class.
 */
interface SyntheticEmbeddingsParams extends EmbeddingsParams {
  vectorSize: number;
}

/**
 * A class that provides synthetic embeddings by overriding the
 * embedDocuments and embedQuery methods to generate embeddings based on
 * the input documents. The embeddings are generated by converting each
 * document into chunks, calculating a numerical value for each chunk, and
 * returning an array of these values as the embedding.
 */
export class SyntheticEmbeddings
  extends Embeddings
  implements SyntheticEmbeddingsParams
{
  vectorSize: number;

  constructor(params?: SyntheticEmbeddingsParams) {
    super(params ?? {});
    this.vectorSize = params?.vectorSize ?? 4;
  }

  /**
   * Generates synthetic embeddings for a list of documents.
   * @param documents List of documents to generate embeddings for.
   * @returns A promise that resolves with a list of synthetic embeddings for each document.
   */
  async embedDocuments(documents: string[]): Promise<number[][]> {
    return Promise.all(documents.map((doc) => this.embedQuery(doc)));
  }

  /**
   * Generates a synthetic embedding for a document. The document is
   * converted into chunks, a numerical value is calculated for each chunk,
   * and an array of these values is returned as the embedding.
   * @param document The document to generate an embedding for.
   * @returns A promise that resolves with a synthetic embedding for the document.
   */
  async embedQuery(document: string): Promise<number[]> {
    let doc = document;

    // Only use the letters (and space) from the document, and make them lower case
    doc = doc.toLowerCase().replaceAll(/[^a-z ]/g, "");

    // Pad the document to make sure it has a divisible number of chunks
    const padMod = doc.length % this.vectorSize;
    const padGapSize = padMod === 0 ? 0 : this.vectorSize - padMod;
    const padSize = doc.length + padGapSize;
    doc = doc.padEnd(padSize, " ");

    // Break it into chunks
    const chunkSize = doc.length / this.vectorSize;
    const docChunk = [];
    for (let co = 0; co < doc.length; co += chunkSize) {
      docChunk.push(doc.slice(co, co + chunkSize));
    }

    // Turn each chunk into a number
    const ret: number[] = docChunk.map((s) => {
      let sum = 0;
      // Get a total value by adding the value of each character in the string
      for (let co = 0; co < s.length; co += 1) {
        sum += s === " " ? 0 : s.charCodeAt(co);
      }
      // Reduce this to a number between 0 and 25 inclusive
      // Then get the fractional number by dividing it by 26
      const ret = (sum % 26) / 26;
      return ret;
    });

    return ret;
  }
}
