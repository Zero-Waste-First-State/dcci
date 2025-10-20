// creates the pdf with the data from the dnrec_report function

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const s = StyleSheet.create({
  page: { padding: 28, fontSize: 11 },
  h1: { fontSize: 18, marginBottom: 8 },
  h2: { fontSize: 14, marginBottom: 6, color: '#333' },
  meta: { marginBottom: 8, color: '#555' },
  table: { borderWidth: 1, borderColor: '#ddd' },
  row: { flexDirection: 'row' },
  cell: { flex: 1, padding: 6, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#ddd' },
  head: { backgroundColor: '#f2f2f2', fontWeight: 'bold' },
});

export default function DnrecPdf({ 
  rows, 
  year, 
  siteName 
}: { 
  rows: any[]; 
  year: number | 'current';
  siteName?: string | null;
}) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.h1}>DNREC Report</Text>
        <Text style={s.meta}>Year: {year}</Text>
        {year === 2024 && (
          <Text style={s.meta}>* Using final 2024 results from DNREC 4th Quarter Report</Text>
        )}
        {siteName && (
          <Text style={s.h2}>Site: {siteName}</Text>
        )}
        {!siteName && (
          <Text style={s.h2}>All Sites Combined</Text>
        )}

        <View style={[s.row, s.head, s.table]}>
          <Text style={s.cell}>Quarter</Text>
          <Text style={s.cell}>Green lbs</Text>
          <Text style={s.cell}>Green gal</Text>
          <Text style={s.cell}>Brown lbs</Text>
          <Text style={s.cell}>Brown gal</Text>
          <Text style={s.cell}>Finished gal</Text>
          <Text style={s.cell}>Ancillary</Text>
          <Text style={s.cell}>Litter Instances</Text>
        </View>

        {rows.map((r: any, i: number) => (
          <View key={i} style={s.row}>
            <Text style={s.cell}>{r.quarter}</Text>
            <Text style={s.cell}>{Number(r.total_composted_green_lbs ?? 0).toFixed(1)}</Text>
            <Text style={s.cell}>{Number(r.total_green_gallons ?? 0).toFixed(0)}</Text>
            <Text style={s.cell}>{Number(r.estimated_browns_lbs ?? 0).toFixed(1)}</Text>
            <Text style={s.cell}>{Number(r.total_browns_gallons ?? 0).toFixed(0)}</Text>
            <Text style={s.cell}>{Number(r.total_finished_compost_gallons ?? 0).toFixed(0)}</Text>
            <Text style={s.cell}>{Number(r.ancillary_wastes_qty ?? 0)}</Text>
            <Text style={s.cell}>{Number(r.litter_instances ?? 0)}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}
