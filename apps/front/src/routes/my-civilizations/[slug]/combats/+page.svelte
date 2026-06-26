<script lang="ts">
  import type { PageData } from './$types'

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props()

  const fmt = (n: number) => n.toLocaleString('fr-FR')

  const outcomeLabel = (role: string, attackerWins: boolean) =>
    role === 'attacker' ? (attackerWins ? 'Victoire' : 'Défaite') : (!attackerWins ? 'Victoire' : 'Défaite')

  const outcomeColor = (role: string, attackerWins: boolean) =>
    (role === 'attacker' ? attackerWins : !attackerWins)
      ? 'oklch(0.42 0.14 145)'
      : 'oklch(0.5 0.18 30)'

  let expandedId = $state<string | null>(null)
  const toggleRow = (battleId: string) => {
    expandedId = expandedId === battleId ? null : battleId
  }
</script>

<svelte:head>
  <title>Journal des conflits — {data.civilization.name}</title>
</svelte:head>

<div class="civ-page-wrapper">
  <div style="animation:screenIn .46s cubic-bezier(.22,.72,.2,1) .05s both;">
    <div style="font-size:15px; color:oklch(0.55 0.03 50); margin-bottom:20px;">
      <a href="/my-civilizations/{data.slug}" style="color:oklch(0.5 0.1 40); text-decoration:none;">{data.civilization.name}</a>
      <span style="margin:0 6px;">›</span>
      <span>Journal des conflits</span>
    </div>

    <h1 style="font-family:'Marcellus',serif; font-size:clamp(26px,4vw,36px); margin:0 0 24px; color:oklch(0.3 0.04 40);">Journal des conflits</h1>

    <div class="civ-inner-card">
      {#if data.logs.length === 0}
        <p style="color:oklch(0.55 0.03 50); font-style:italic; font-size:16px;">Aucun conflit enregistré pour cette civilisation.</p>
      {:else}
        <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; font-family:'EB Garamond',serif; font-size:15px; color:oklch(0.35 0.04 40);">
            <thead>
              <tr style="border-bottom:2px solid oklch(0.74 0.05 60);">
                <th style="text-align:left; padding:10px 12px; font-family:'Marcellus',serif; font-weight:400; color:oklch(0.45 0.05 50);">Mois</th>
                <th style="text-align:left; padding:10px 12px; font-family:'Marcellus',serif; font-weight:400; color:oklch(0.45 0.05 50);">Rôle</th>
                <th style="text-align:left; padding:10px 12px; font-family:'Marcellus',serif; font-weight:400; color:oklch(0.45 0.05 50);">Adversaire</th>
                <th style="text-align:left; padding:10px 12px; font-family:'Marcellus',serif; font-weight:400; color:oklch(0.45 0.05 50);">Issue</th>
                <th style="text-align:right; padding:10px 12px; font-family:'Marcellus',serif; font-weight:400; color:oklch(0.45 0.05 50);">Mes pertes</th>
                <th style="text-align:right; padding:10px 12px; font-family:'Marcellus',serif; font-weight:400; color:oklch(0.45 0.05 50);">Ses pertes</th>
                <th style="text-align:right; padding:10px 12px; font-family:'Marcellus',serif; font-weight:400; color:oklch(0.45 0.05 50);">Captifs</th>
                <th style="text-align:center; padding:10px 12px; font-family:'Marcellus',serif; font-weight:400; color:oklch(0.45 0.05 50);">Butin</th>
              </tr>
            </thead>
            <tbody>
              {#each data.logs as log}
                {@const won = log.role === 'attacker' ? log.attackerWins : !log.attackerWins}
                {@const totalPlunder = log.plunderedResources.reduce((s: number, r: { amount: number }) => s + r.amount, 0)}
                <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
                <tr
                  onclick={() => toggleRow(log.battleId)}
                  style="border-bottom:1px solid oklch(0.86 0.03 70); cursor:{log.plunderedResources.length > 0 ? 'pointer' : 'default'}; background:{expandedId === log.battleId ? 'oklch(0.97 0.015 84)' : 'transparent'}; transition:background 0.15s;"
                >
                  <td style="padding:10px 12px;">{log.month}</td>
                  <td style="padding:10px 12px;">{log.role === 'attacker' ? '⚔ Attaquant' : '🛡 Défenseur'}</td>
                  <td style="padding:10px 12px; font-weight:600;">{log.opponentName}</td>
                  <td style="padding:10px 12px; color:{outcomeColor(log.role, log.attackerWins)}; font-family:'Marcellus',serif;">{outcomeLabel(log.role, log.attackerWins)}</td>
                  <td style="padding:10px 12px; text-align:right; color:oklch(0.5 0.18 30);">{Math.round(log.myLossRatio * 100)}%</td>
                  <td style="padding:10px 12px; text-align:right; color:oklch(0.45 0.05 50);">{Math.round(log.opponentLossRatio * 100)}%</td>
                  <td style="padding:10px 12px; text-align:right;">{log.captivesTaken > 0 ? log.captivesTaken : '—'}</td>
                  <td style="padding:10px 12px; text-align:center;">{totalPlunder > 0 ? fmt(totalPlunder) : '—'}</td>
                </tr>
                {#if expandedId === log.battleId && log.plunderedResources.length > 0}
                  <tr style="background:oklch(0.97 0.015 84);">
                    <td colspan="8" style="padding:8px 24px 14px;">
                      <div style="display:flex; flex-wrap:wrap; gap:8px;">
                        {#each log.plunderedResources as r}
                          <span style="font-size:13px; background:oklch(0.93 0.03 80); border:1px solid oklch(0.8 0.04 70); border-radius:4px; padding:3px 10px; color:oklch(0.4 0.05 50);">
                            {r.type}: +{fmt(r.amount)}
                          </span>
                        {/each}
                      </div>
                    </td>
                  </tr>
                {/if}
              {/each}
            </tbody>
          </table>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:16px;">
          {#if data.page > 0}
            <a href="?page={data.page - 1}" style="padding:8px 16px; border:1px solid oklch(0.74 0.05 60); border-radius:4px; color:oklch(0.45 0.06 40); font-family:'Marcellus',serif; font-size:15px; text-decoration:none;">← Précédent</a>
          {:else}
            <span></span>
          {/if}
          <span style="font-size:14px; color:oklch(0.55 0.03 50);">Page {data.page + 1}</span>
          {#if data.logs.length === data.pageSize}
            <a href="?page={data.page + 1}" style="padding:8px 16px; border:1px solid oklch(0.74 0.05 60); border-radius:4px; color:oklch(0.45 0.06 40); font-family:'Marcellus',serif; font-size:15px; text-decoration:none;">Suivant →</a>
          {:else}
            <span></span>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>
