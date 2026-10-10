import { useAuth } from '../context/AuthContext.jsx';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

      {/* Page heading */}
      <div className="mb-7">
        <p className="text-sm text-[#857a72]">
          Welcome back,
        </p>

        <div className="mt-1 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-[#241d1a] sm:text-4xl">
              {user?.name}
            </h2>

            <p className="mt-2 text-sm text-[#857a72]">
              Here's what's happening with your hotel today.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#e4d7ca] bg-white px-3 py-2 text-xs font-medium text-[#685d55]">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            System operational
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          label="Today's Orders"
          value="—"
          description="Live orders will appear here"
          icon="orders"
        />

        <StatCard
          label="Pending Orders"
          value="—"
          description="Awaiting staff action"
          icon="pending"
        />

        <StatCard
          label="Today's Revenue"
          value="₹—"
          description="Based on delivered orders"
          icon="revenue"
        />

        <StatCard
          label="Active Rooms"
          value="—"
          description="Currently active rooms"
          icon="rooms"
        />

      </div>

      {/* Main content */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">

        {/* Recent Orders */}
        <section className="rounded-2xl border border-[#e7ddd3] bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-[#eee5dc] px-5 py-5 sm:px-6">
            <div>
              <h3 className="text-base font-semibold text-[#2b211d]">
                Recent Orders
              </h3>

              <p className="mt-1 text-xs text-[#92867d]">
                Your latest hotel food orders
              </p>
            </div>

            <span className="rounded-full bg-[#f8f2eb] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#9a7a52]">
              Live
            </span>
          </div>

          <div className="flex min-h-[260px] items-center justify-center px-6 py-10">
            <div className="max-w-sm text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f8f2eb] text-[#9a7a52]">
                <OrdersIcon />
              </div>

              <h4 className="mt-4 text-sm font-semibold text-[#403630]">
                No live order data yet
              </h4>

              <p className="mt-2 text-xs leading-5 text-[#92867d]">
                The Orders module will connect directly
                to your existing backend and MongoDB.
              </p>

            </div>
          </div>

        </section>

        {/* Hotel Overview */}
        <section className="rounded-2xl border border-[#e7ddd3] bg-white shadow-sm">

          <div className="border-b border-[#eee5dc] px-5 py-5 sm:px-6">
            <h3 className="text-base font-semibold text-[#2b211d]">
              Account Overview
            </h3>

            <p className="mt-1 text-xs text-[#92867d]">
              Current administrator information
            </p>
          </div>

          <div className="space-y-5 p-5 sm:p-6">

            <InfoRow
              label="Name"
              value={user?.name || '—'}
            />

            <InfoRow
              label="Email"
              value={user?.email || '—'}
            />

            <InfoRow
              label="Role"
              value={formatRole(user?.role)}
            />

            <InfoRow
              label="Hotel"
              value={
                user?.hotelId
                  ? user.hotelId
                  : 'System Administrator'
              }
            />

          </div>

        </section>

      </div>

      {/* Modules */}
      <section className="mt-6 rounded-2xl border border-[#e7ddd3] bg-white p-5 shadow-sm sm:p-6">

        <div>
          <h3 className="text-base font-semibold text-[#2b211d]">
            Management Modules
          </h3>

          <p className="mt-1 text-xs text-[#92867d]">
            Modules being connected to the hotel management system.
          </p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">

          <ModuleCard
            title="Orders"
            description="Manage guest food orders"
            icon="orders"
          />

          <ModuleCard
            title="Food Items"
            description="Manage menu and pricing"
            icon="food"
          />

          <ModuleCard
            title="Rooms"
            description="Manage QR room access"
            icon="rooms"
          />

          <ModuleCard
            title="Events"
            description="Manage wedding events"
            icon="events"
          />

          <ModuleCard
            title="Categories"
            description="Organize the food menu"
            icon="category"
          />

        </div>

      </section>

    </div>
  );
}

function StatCard({
  label,
  value,
  description,
  icon,
}) {
  return (
    <div className="rounded-2xl border border-[#e7ddd3] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

      <div className="flex items-start justify-between gap-3">

        <div>
          <p className="text-sm font-medium text-[#71665e]">
            {label}
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight text-[#241d1a]">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f8f2eb] text-[#8e6948]">
          <DashboardIcon name={icon} />
        </div>

      </div>

      <p className="mt-3 text-xs text-[#9b9088]">
        {description}
      </p>

    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#f0e8e1] pb-4 last:border-0 last:pb-0">

      <span className="text-xs font-medium text-[#92867d]">
        {label}
      </span>

      <span className="max-w-[65%] break-all text-right text-sm font-medium text-[#403630]">
        {value}
      </span>

    </div>
  );
}

function ModuleCard({
  title,
  description,
  icon,
}) {
  return (
    <div className="rounded-xl border border-[#eee5dc] bg-[#fcfaf7] p-4">

      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f3eae0] text-[#8e6948]">
        <DashboardIcon name={icon} />
      </div>

      <p className="mt-3 text-sm font-semibold text-[#403630]">
        {title}
      </p>

      <p className="mt-1 text-xs leading-5 text-[#978b82]">
        {description}
      </p>

      <div className="mt-3 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#b19d8b]">
        Coming next
      </div>

    </div>
  );
}

function DashboardIcon({ name }) {
  if (name === 'orders') {
    return <OrdersIcon />;
  }

  if (name === 'pending') {
    return <PendingIcon />;
  }

  if (name === 'revenue') {
    return <RevenueIcon />;
  }

  if (name === 'rooms') {
    return <RoomsIcon />;
  }

  if (name === 'food') {
    return <FoodIcon />;
  }

  if (name === 'events') {
    return <EventsIcon />;
  }

  if (name === 'category') {
    return <CategoryIcon />;
  }

  return null;
}

function OrdersIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 3h12" />
      <path d="M7 3v3.5a5 5 0 0 0 10 0V3" />
      <path d="M9 13h6" />
      <path d="M8 17h8" />
      <path d="M5 21h14" />
    </svg>
  );
}

function PendingIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function RevenueIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v18" />
      <path d="M17 7.5c0-1.7-2-3-5-3s-5 1.3-5 3 2 3 5 3 5 1.3 5 3-2 3-5 3-5-1.3-5-3" />
    </svg>
  );
}

function RoomsIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 20V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14" />
      <path d="M4 17h16" />
      <path d="M7 17v3" />
      <path d="M17 17v3" />
      <path d="M8 9h3" />
      <path d="M14 9h3" />
      <path d="M8 12h3" />
      <path d="M14 12h3" />
    </svg>
  );
}

function FoodIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 3v18" />
      <path d="M8 3v7" />
      <path d="M4 10h4" />
      <path d="M15 3v18" />
      <path d="M20 3v18" />
      <path d="M15 9c0-3 1.7-6 5-6" />
    </svg>
  );
}

function EventsIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2"
      />
      <path d="M16 3v4" />
      <path d="M8 3v4" />
      <path d="M3 10h18" />
      <path d="m9 16 2 2 4-4" />
    </svg>
  );
}

function CategoryIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect
        x="3"
        y="3"
        width="7"
        height="7"
        rx="1.5"
      />
      <rect
        x="14"
        y="3"
        width="7"
        height="7"
        rx="1.5"
      />
      <rect
        x="3"
        y="14"
        width="7"
        height="7"
        rx="1.5"
      />
      <rect
        x="14"
        y="14"
        width="7"
        height="7"
        rx="1.5"
      />
    </svg>
  );
}

function formatRole(role) {
  if (!role) return 'Administrator';

  return role
    .split('_')
    .map(
      (part) =>
        part.charAt(0) +
        part.slice(1).toLowerCase()
    )
    .join(' ');
}