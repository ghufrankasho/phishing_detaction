import {
  List, Datagrid, TextField, DateField, SelectField, NumberField,
  SelectInput, TextInput, Edit, SimpleForm, Toolbar, SaveButton, FormDataConsumer,
} from "react-admin";

const reportChoices = [
  { id: "false_positive", name: "False positive (safe flagged as risky)" },
  { id: "false_negative", name: "False negative (risky marked safe)" },
];

const statusChoices = [
  { id: "pending", name: "Pending" },
  { id: "accepted", name: "Accepted" },
  { id: "rejected", name: "Rejected" },
];

const labelChoices = [
  { id: "safe", name: "Safe" },
  { id: "suspicious", name: "Suspicious" },
  { id: "phishing", name: "Phishing" },
];

const filters = [
  <SelectInput key="status" source="status" choices={statusChoices} alwaysOn />,
  <SelectInput key="report_type" source="report_type" label="Type" choices={reportChoices} />,
];

export const FeedbackList = () => (
  <List
    filters={filters}
    filterDefaultValues={{ status: "pending" }}
    sort={{ field: "id", order: "DESC" }}
    perPage={25}
  >
    <Datagrid rowClick="edit">
      <TextField source="id" />
      <TextField source="user_email" label="User" />
      <SelectField source="report_type" label="Type" choices={reportChoices} />
      <TextField source="scan_label" label="Model said" />
      <NumberField source="scan_score" label="Score" />
      <SelectField source="status" choices={statusChoices} />
      <DateField source="created_at" showTime />
    </Datagrid>
  </List>
);

const ReviewToolbar = () => (
  <Toolbar>
    <SaveButton />
  </Toolbar>
);

export const FeedbackEdit = () => (
  <Edit mutationMode="pessimistic">
    <SimpleForm toolbar={<ReviewToolbar />}>
      <TextInput source="user_email" label="Reported by" disabled fullWidth />
      <TextInput source="scan_content" label="Message (masked)" disabled multiline fullWidth />
      <TextInput source="scan_label" label="Model result" disabled />
      <TextInput source="scan_score" label="Model score" disabled />
      <SelectInput source="report_type" label="User says" choices={reportChoices} disabled fullWidth />
      <TextInput source="comment" label="User comment" disabled multiline fullWidth />

      <SelectInput source="status" choices={statusChoices} />
      <FormDataConsumer>
        {({ formData }) =>
          formData.status === "accepted" && (
            <SelectInput source="correct_label" label="Correct label" choices={labelChoices} />
          )
        }
      </FormDataConsumer>
    </SimpleForm>
  </Edit>
);