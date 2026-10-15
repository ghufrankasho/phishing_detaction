import {
  List, Datagrid, TextField, EmailField, SelectField,
  TextInput, SelectInput, Edit, SimpleForm, Toolbar,
  SaveButton, DeleteWithConfirmButton,
} from "react-admin";

const roleChoices = [
  { id: 1, name: "User" },
  { id: 2, name: "admin" },
];

export const UserList = () => (
  <List   sort={{ field: "id", order: "DESC" }} perPage={25}>
    <Datagrid rowClick="edit">
      <TextField source="id" />
      <TextField source="name" />
      <EmailField source="email" />
      <TextField source="role" />
      <TextField source="created_at" />
    </Datagrid>
  </List>
);

export const UserEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="id" disabled />
      <TextInput source="name" />
      <TextInput source="email" disabled />
      <SelectInput source="role" label="Role" choices={roleChoices} defaultValue={"user"}/>
        
    </SimpleForm>
  </Edit>
);
// Save on the left, Delete on the right
export const EditToolbar = () => (
  <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
    <SaveButton />
    <DeleteWithConfirmButton
      confirmTitle="Delete this user?"
      confirmContent="This can't be undone."
      mutationMode="pessimistic"
    />
  </Toolbar>
);

