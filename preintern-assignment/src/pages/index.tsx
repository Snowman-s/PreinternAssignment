import { createClient } from "@supabase/supabase-js"
import { InferGetServerSidePropsType } from "next"

type CountByPref = {
    total: number,
    hall_code: number,
    pref_id: number,
    pref_name: string
}[]

export default function Home({
    view, code_collection
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
    if (!view || !code_collection) {
        return <>Server Error!</>;
    }

    const numberCellStyle = "border border-slate-800 text-right";
    const stringCellStyle = "border border-slate-800 text-center";

    const headers = code_collection.sort(code => code.id).map((code, index) => <th key={"th" + index} className={stringCellStyle}>{code.name}</th>);
    /**
     表示のため、データを変形する。
     集会施設の種類によって分かれている総数を１つの行に並べる。
     totals[city_public_hall_code] に施設総数が入る。
     */
    const groupedByPref: {
        pref_id: number,
        pref_name: string
        totals: { [key: number]: number },
    }[] = (() => {
        let grouped: { pref_id: number; pref_name: string; totals: { [key: number]: number }; }[] = [];
        for (const row of view) {
            let targetPref = grouped.find(g => g.pref_id == row.pref_id);
            if (!targetPref) {
                targetPref = { pref_id: row.pref_id, pref_name: row.pref_name, totals: {} }
                grouped.push(targetPref);
            }
            targetPref.totals[row.hall_code] = row.total;
        }
        return grouped;
    })();

    return (<table className="border-collapse border border-slate-950">
        <caption>市町村役場等及び公的集会施設データ</caption>
        <thead>
            <tr>
                <th className={stringCellStyle}>県名</th>
                {headers}
                <th className={stringCellStyle}>総数</th>
            </tr>
        </thead>
        <tbody>
            {groupedByPref.sort((a, b) => a.pref_id - b.pref_id).map((elm, index) =>
            (<tr key={"tbody" + index}>
                <td className={stringCellStyle}>{elm.pref_name}</td>

                {code_collection.map(code => <td key={"td" + index + "-" + code.id} className={numberCellStyle}>{elm.totals[code.id] ?? "-"}</td>)}

                <td className={numberCellStyle}>{code_collection.map(code => elm.totals[code.id]).reduce((p, c) => p + c, 0)}</td>
            </tr>)
            )}
        </tbody>
    </table>)
}

export async function getServerSideProps() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const res: { data: CountByPref | null, error: unknown } = await supabase.from("count_by_pref_and_hall_code_view").select()
    const res2: { data: { id: number, name: string }[] | null, error: unknown } = await supabase.from("CityPublicHallCode").select()
    return { props: { view: res.data, code_collection: res2.data } }
}