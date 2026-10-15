import { Admin, Resource, ListGuesser } from "react-admin";
import simpleRestProvider from "ra-data-simple-rest";
import { UserList, UserEdit } from "./resources/users";
import { authProvider } from "./js/authProvider";
import { httpClient } from "./js/httpClient";
import { DomainsList, DomainsEdit, DomainsCreate } from "./resources/domainLists";
import { PatternsList, PatternsEdit, PatternsCreate } from "./resources/threatPatterns";
import { FeedbackEdit, FeedbackList } from "./resources/feedback";

const dataProvider = simpleRestProvider("http://127.0.0.1:8000",httpClient);

export default function App() {
  return (
    <Admin dataProvider={dataProvider}authProvider={authProvider} basename="/admin">

      <Resource name="users" list={UserList} edit={UserEdit} />
      <Resource name="users" list={UserList} edit={UserEdit} />
      <Resource name="domain_lists" list={DomainsList} edit={DomainsEdit} create={DomainsCreate}
                options={{ label: "Domain lists" }} />
      <Resource name="threat_patterns" list={PatternsList} edit={PatternsEdit} create={PatternsCreate}
                options={{ label: "Threat patterns" }} />
      <Resource name="feedback" list={FeedbackList} edit={FeedbackEdit}
          options={{ label: "Reported results" }} />
    </Admin>
  );
}