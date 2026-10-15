import { Toolbar, SaveButton, DeleteWithConfirmButton } from "react-admin";

export const FormToolbar = () => (
  <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
    <SaveButton />
    <DeleteWithConfirmButton
      confirmTitle="Delete this item?"
      confirmContent="This can't be undone."
      mutationMode="pessimistic"
    />
  </Toolbar>
);