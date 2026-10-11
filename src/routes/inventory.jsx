import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell, useCenterScope } from "@/components/AppShell";
import { PageHeader, Panel, Table, Td, Tag, Empty, TextInput, SortSelect, sortBooks } from "@/components/kit";
import { db, fmtDate } from "@/lib/db";
import { pageHead } from "@/lib/seo";
export const Route = createFileRoute("/inventory")({
    head: pageHead("Inventory", "Books held at each study center."),
    component: () => (<AppShell roles={["STUDY_CENTER"]}>
      <Inventory />
    </AppShell>),
});
function Inventory() {
    const nav = useNavigate();
    const { centerId, picker } = useCenterScope();
    const [sort, setSort] = useState("az");
    const [search, setSearch] = useState("");
    const inv = useQuery({
        queryKey: ["inventory", centerId],
        enabled: !!centerId,
        queryFn: async () => (await db.from("center_inventory").select("*, master_books(title,author)").eq("center_id", centerId)).data ?? [],
    });
    const all = inv.data ?? [];
    const list = sortBooks(all.filter((i) => `${i.master_books?.title} ${i.master_books?.author}`.toLowerCase().includes(search.toLowerCase())), sort, (i) => i.master_books?.title ?? "", (i) => i.total_allocated);
    const total = list.reduce((s, i) => s + i.total_allocated, 0);
    const out = list.reduce((s, i) => s + i.currently_borrowed, 0);
    return (<>
      <PageHeader title="Inventory" sub={`${list.length} titles · ${total} copies · ${out} on loan`} action={picker}/>
      <Panel>
        <div className="mb-4 flex flex-wrap gap-2">
          <TextInput placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="min-w-0 flex-1"/>
          <SortSelect value={sort} onChange={setSort}/>
        </div>
        {list.length ? (<Table head={["Title", "Author", "Allocated", "Available", "On loan", "Last issued", ""]}>
            {list.map((i) => {
                const idle = !i.last_issued_date || Date.now() - new Date(i.last_issued_date).getTime() > 90 * 864e5;
                return (<tr key={i.id} className="cursor-pointer hover:bg-muted/50" onClick={() => nav({ to: "/inventory/$bookId", params: { bookId: i.book_id } })}>
                  <Td className="font-medium">{i.master_books?.title}</Td>
                  <Td>{i.master_books?.author}</Td>
                  <Td>{i.total_allocated}</Td>
                  <Td>{i.currently_available}</Td>
                  <Td>{i.currently_borrowed}</Td>
                  <Td>{fmtDate(i.last_issued_date)}</Td>
                  <Td>{i.currently_available === 0 ? <Tag tone="red">Out of stock</Tag> : idle ? <Tag tone="amber">Idle</Tag> : <Tag tone="green">Active</Tag>}</Td>
                </tr>);
            })}
          </Table>) : <Empty>No books at this center yet.</Empty>}
      </Panel>
    </>);
}
