export interface SearchableClient {
  id?: string;
  complete_name?: string;
  name_system?: string;
  name?: string;
  nombre?: string;
  username?: string;
}

export const getClientDisplayName = (client?: SearchableClient | null) =>
  client?.complete_name ||
  client?.name_system ||
  client?.name ||
  client?.nombre ||
  client?.username ||
  "";

const normalizeClientSearch = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");

export const filterAndSortClients = <T extends SearchableClient>(
  clients: T[],
  search: string,
) => {
  const normalizedSearch = normalizeClientSearch(search.trim());
  return [...clients]
    .filter((client) =>
      normalizeClientSearch(getClientDisplayName(client)).includes(
        normalizedSearch,
      ),
    )
    .sort((left, right) =>
      getClientDisplayName(left).localeCompare(getClientDisplayName(right), "es", {
        sensitivity: "base",
      }),
    );
};
