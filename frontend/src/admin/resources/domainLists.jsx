import {
  List, Datagrid, TextField, DateField, SelectField, TextInput, SelectInput,
  Edit, Create, SimpleForm, required,
} from "react-admin";
import { FormToolbar } from "../components/FormToolbar";

const typeChoices = [
  { id: "whitelist", name: "Whitelist" },
  { id: "blacklist", name: "Blacklist" },
  { id: "official", name: "Official domain" },
];

const filters = [
  <TextInput key="q" source="q" label="Search domain" alwaysOn />,
  <SelectInput key="list_type" source="list_type" label="List" choices={typeChoices} />,
];

export const DomainsList = () => (
  <List filters={filters} sort={{ field: "id", order: "DESC" }} perPage={25}>
    <Datagrid rowClick="edit">
      <TextField source="id" />
      <TextField source="domain" />
      <SelectField source="list_type" label="List" choices={typeChoices} />
      <TextField source="notes" />
      <DateField source="created_at" />
    </Datagrid>
  </List>
);

export const DomainsEdit = () => (
  <Edit mutationMode="pessimistic">
    <SimpleForm toolbar={<FormToolbar />}>
      <TextInput source="id" disabled />
      <TextInput source="domain" validate={required()} fullWidth />
      <SelectInput source="list_type" label="List" choices={typeChoices} validate={required()} />
      <TextInput source="notes" multiline fullWidth />
    </SimpleForm>
  </Edit>
);

export const DomainsCreate = () => (
  <Create redirect="list">
    <SimpleForm toolbar={<FormToolbar />}>
      <TextInput source="domain" validate={required()} fullWidth helperText="e.g. paypal.com (links like https://www.paypal.com/login are cleaned automatically)" />
      <SelectInput source="list_type" label="List" choices={typeChoices} validate={required()} />
      <TextInput source="notes" multiline fullWidth />
    </SimpleForm>
  </Create>
);