export const MenuList = [
  {
    title: "Operations",
    classsChange: "mm-collapse",
    iconStyle: <i className="flaticon-025-dashboard" />,
    content: [
      {
        title: "Company",
        to: "company",
        roles: ["owner"],
      },
      {
        title: "Dashboard",
        to: "dashboard",
        roles: ["owner", "manager", "front_desk"],
      },
      {
        title: "Reservations",
        to: "reservations",
        roles: ["owner", "manager", "front_desk"],
      },
      {
        title: "Guests",
        to: "guests",
        roles: ["owner", "manager", "front_desk"],
      },
      {
        title: "Rooms",
        to: "rooms",
        roles: ["owner", "manager", "front_desk"],
      },
      {
        title: "Properties",
        to: "properties",
        roles: ["owner", "manager"],
      },
      {
        title: "Staff Access",
        to: "staff-access",
        roles: ["owner"],
      },
    ],
  },
];
