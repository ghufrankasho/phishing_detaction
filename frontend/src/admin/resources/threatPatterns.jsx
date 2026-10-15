import {
  List, Datagrid, TextField, DateField, SelectField, BooleanField,
  TextInput, SelectInput, BooleanInput, Edit, Create, SimpleForm, required,
} from "react-admin";
import { FormToolbar } from "../components/FormToolbar";

const typeChoices = [
  { id: "keyword", name: "Keyword" },
  { id: "regex", name: "Regular expression" },
];

const categoryChoices = [
  { id: "urgency", name: "Urgency" },
  { id: "credentials", name: "Credential request" },
  { id: "banking", name: "Banking data" },
  { id: "prize", name: "Prize wording" },
  { id: "impersonation", name: "Impersonation" },
];

const filters = [
  <TextInput key="q" source="q" label="Search pattern" alwaysOn />,
  <SelectInput key="category" source="category" choices={categoryChoices} />,
  <SelectInput key="pattern_type" source="pattern_type" label="Type" choices={typeChoices} />,
  <BooleanInput key="is_active" source="is_active" label="Active" />,
];

export const PatternsList = () => (
  <List filters={filters} sort={{ field: "id", order: "DESC" }} perPage={25}>
    <Datagrid rowClick="edit">
      <TextField source="id" />
      <TextField source="pattern" />
      <SelectField source="pattern_type" label="Type" choices={typeChoices} />
      <SelectField source="category" choices={categoryChoices} />
      <BooleanField source="is_active" label="Active" />
      <DateField source="created_at" />
    </Datagrid>
  </List>
);

const PatternFields = () => (
  <>
    <TextInput source="pattern" validate={required()} fullWidth />
    <SelectInput source="pattern_type" label="Type" choices={typeChoices} validate={required()} />
    <SelectInput source="category" choices={categoryChoices} validate={required()} />
    <BooleanInput source="is_active" label="Active" defaultValue={true} />
  </>
);

export const PatternsEdit = () => (
  <Edit mutationMode="pessimistic">
    <SimpleForm toolbar={<FormToolbar />}>
      <TextInput source="id" disabled />
      <PatternFields />
    </SimpleForm>
  </Edit>
);

export const PatternsCreate = () => (
  <Create redirect="list">
    <SimpleForm>
      <PatternFields />
    </SimpleForm>
  </Create>
);