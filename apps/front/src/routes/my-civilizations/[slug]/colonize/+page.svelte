<script lang="ts">
  import type { PageData, ActionData } from './$types'
  import { enhance } from '$app/forms'
  import { techNames, resourceNames } from '$lib/translations'
  import Breadcrumb from '$lib/components/Breadcrumb.svelte'
  import PercentSlider from '$lib/components/PercentSlider.svelte'
  import { toast } from 'svelte-sonner'
  import { goto } from '$app/navigation'

  let { data, form }: { data: PageData; form: ActionData } = $props()

  const civ = $derived(data.civilization)
  const totalPeople = $derived(civ.citizensCount ?? 0)
  const civResources = $derived(
    (civ.resources ?? []) as { type: string; quantity: number }[],
  )

  let colonyName = $state('')
  let populationPercent = $state(20)
  let resourcePercents = $state<Record<string, number>>(
    Object.fromEntries(
      ((data.civilization.resources ?? []) as { type: string }[]).map((r) => [r.type, 0]),
    ),
  )
  let selectedTechs = $state<string[]>([])
  let submitting = $state(false)

  const POP_PRESETS = [5, 10, 20, 30, 50]
  const RES_PRESETS = [0, 10, 25, 50]

  const transferCount = $derived(Math.floor((totalPeople * populationPercent) / 100))
  const remainingCount = $derived(totalPeople - transferCount)
  const popValid = $derived(remainingCount >= 10 && transferCount >= 1)
  const canSubmit = $derived(colonyName.trim().length >= 3 && popValid && !submitting)

  const resourcesPayload = $derived(
    civResources
      .filter((r) => (resourcePercents[r.type] ?? 0) > 0)
      .map((r) => ({
        type: r.type,
        amount: Math.floor((r.quantity * (resourcePercents[r.type] ?? 0)) / 100),
      })),
  )

  const toggleTech = (id: string) => {
    selectedTechs = selectedTechs.includes(id)
      ? selectedTechs.filter((t) => t !== id)
      : [...selectedTechs, id]
  }
</script>

<svelte:head>
  <title>Fonder une colonie — {civ.name}</title>
</svelte:head>

<div class="civ-page-wrapper">
  <Breadcrumb
    items={[
      { label: 'Mes civilisations', href: '/my-civilizations' },
      { label: civ.name, href: `/my-civilizations/${civ.id}` },
      { label: 'Fonder une colonie' },
    ]}
  />

  <div class="civ-card" style="max-width:620px;">
    <div style="border-bottom:2px solid oklch(0.72 0.05 60); padding-bottom:14px; margin-bottom:24px;">
      <h1 style="font-family:'Tangerine',cursive; font-size:clamp(34px,5.5vw,48px); margin:0; color:oklch(0.3 0.04 40);">
        🌍 Fonder une colonie
      </h1>
      <p style="margin:4px 0 0; font-family:'EB Garamond',serif; font-size:15px; color:oklch(0.5 0.03 50);">
        Une fraction de votre peuple partira bâtir un nouvel avenir.
      </p>
    </div>

    {#if form?.error}
      <div style="padding:10px 14px; background:oklch(0.96 0.04 25); border:1px solid oklch(0.75 0.12 25); border-radius:4px; font-family:'EB Garamond',serif; font-size:15px; color:oklch(0.42 0.18 25); margin-bottom:20px;">
        {form.error}
      </div>
    {/if}

    <form
      method="POST"
      action="?/colonize"
      use:enhance={() => async ({ result, update }) => {
        submitting = false
        if (result.type === 'redirect') {
          toast.success('Colonie fondée avec succès !')
          goto(result.location)
        } else if (result.type === 'failure') {
          toast.error((result.data as { error?: string })?.error ?? 'Une erreur est survenue')
          await update({ reset: false })
        } else {
          await update()
        }
      }}
      onsubmit={() => { submitting = true }}
      style="display:flex; flex-direction:column; gap:28px;"
    >
      <input type="hidden" name="resources" value={JSON.stringify(resourcesPayload)} />
      <input type="hidden" name="techs" value={JSON.stringify(selectedTechs)} />

      <!-- Colony name -->
      <section style="display:flex; flex-direction:column; gap:8px;">
        <h2 style="font-family:'Marcellus',serif; font-size:17px; margin:0; color:oklch(0.35 0.05 45); border-bottom:1px solid oklch(0.85 0.03 60); padding-bottom:6px;">
          Nom de la colonie
        </h2>
        <input
          type="text"
          name="colonyName"
          bind:value={colonyName}
          minlength="3"
          required
          placeholder="Ex. : Nova Carthago"
          style="width:100%; padding:10px 14px; border:1px solid oklch(0.74 0.05 60); border-radius:4px; font-family:'EB Garamond',serif; font-size:16px; background:oklch(0.985 0.01 84); color:oklch(0.25 0.03 40); box-sizing:border-box;"
        />
      </section>

      <!-- Population -->
      <section style="display:flex; flex-direction:column; gap:10px;">
        <h2 style="font-family:'Marcellus',serif; font-size:17px; margin:0; color:oklch(0.35 0.05 45); border-bottom:1px solid oklch(0.85 0.03 60); padding-bottom:6px;">
          Population
        </h2>

        <!-- Summary cards -->
        <div style="display:flex; gap:12px;">
          <div style="flex:1; padding:12px 16px; background:oklch(0.97 0.025 140 / 0.4); border:1px solid oklch(0.82 0.07 140); border-radius:5px; text-align:center;">
            <div style="font-family:'Marcellus',serif; font-size:28px; color:oklch(0.38 0.1 140); line-height:1;">{transferCount}</div>
            <div style="font-family:'EB Garamond',serif; font-size:12px; color:oklch(0.5 0.06 140); margin-top:3px;">colons transférés</div>
          </div>
          <div style="display:flex; align-items:center; font-size:20px; color:oklch(0.6 0.04 60);">→</div>
          <div style="flex:1; padding:12px 16px; background:oklch(0.97 0.015 55 / 0.4); border:1px solid {!popValid && totalPeople > 0 ? 'oklch(0.75 0.12 25)' : 'oklch(0.82 0.04 60)'}; border-radius:5px; text-align:center;">
            <div style="font-family:'Marcellus',serif; font-size:28px; color:{!popValid && totalPeople > 0 ? 'oklch(0.48 0.18 25)' : 'oklch(0.38 0.06 55)'}; line-height:1;">{remainingCount}</div>
            <div style="font-family:'EB Garamond',serif; font-size:12px; color:oklch(0.5 0.04 55); margin-top:3px;">restent dans la mère</div>
          </div>
        </div>

        {#if !popValid && totalPeople > 0}
          <p style="margin:0; font-family:'EB Garamond',serif; font-size:13px; color:oklch(0.48 0.18 25);">
            La mère doit conserver au moins 10 habitants.
          </p>
        {/if}

        <!-- Presets -->
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          {#each POP_PRESETS as p}
            <button
              type="button"
              onclick={() => (populationPercent = p)}
              style="padding:5px 16px; border:1px solid {populationPercent === p ? 'oklch(0.45 0.12 140)' : 'oklch(0.8 0.04 60)'}; border-radius:999px; background:{populationPercent === p ? 'oklch(0.45 0.12 140)' : 'oklch(0.985 0.01 84)'}; font-family:'Marcellus',serif; font-size:13px; color:{populationPercent === p ? 'oklch(0.97 0.01 84)' : 'oklch(0.45 0.05 50)'}; cursor:pointer;"
            >{p}%</button>
          {/each}
        </div>

        <PercentSlider
          bind:value={populationPercent}
          min={5}
          max={50}
          accent="oklch(0.48 0.12 140)"
          name="populationPercent"
        />
        <div style="display:flex; justify-content:space-between; font-family:'EB Garamond',serif; font-size:12px; color:oklch(0.55 0.04 50);">
          <span>5% minimum</span>
          <span>50% maximum</span>
        </div>
      </section>

      <!-- Resources -->
      {#if civResources.length > 0}
        <section style="display:flex; flex-direction:column; gap:12px;">
          <h2 style="font-family:'Marcellus',serif; font-size:17px; margin:0; color:oklch(0.35 0.05 45); border-bottom:1px solid oklch(0.85 0.03 60); padding-bottom:6px;">
            Ressources
          </h2>
          {#each civResources as resource (resource.type)}
            {@const pct = resourcePercents[resource.type] ?? 0}
            {@const transferAmt = Math.floor((resource.quantity * pct) / 100)}
            <div style="padding:12px 14px; border:1px solid oklch(0.87 0.03 60); border-radius:5px; background:oklch(0.99 0.008 84); display:flex; flex-direction:column; gap:8px;">
              <div style="display:flex; align-items:baseline; gap:10px; flex-wrap:wrap;">
                <span style="font-family:'Marcellus',serif; font-size:15px; color:oklch(0.32 0.04 40); flex:1;">{(resourceNames as Record<string, string>)[resource.type] ?? resource.type}</span>
                <span style="font-family:'EB Garamond',serif; font-size:13px; color:oklch(0.55 0.04 50);">{resource.quantity} dispo.</span>
                {#if transferAmt > 0}
                  <span style="font-family:'EB Garamond',serif; font-size:13px; color:oklch(0.42 0.12 140); font-weight:600;">→ {transferAmt} transférés</span>
                {/if}
              </div>
              <div style="display:flex; gap:5px; flex-wrap:wrap;">
                {#each RES_PRESETS as p}
                  <button
                    type="button"
                    onclick={() => (resourcePercents[resource.type] = p)}
                    style="padding:4px 12px; border:1px solid {pct === p ? 'oklch(0.45 0.12 140)' : 'oklch(0.82 0.04 60)'}; border-radius:999px; background:{pct === p ? 'oklch(0.45 0.12 140)' : 'oklch(0.985 0.01 84)'}; font-family:'Marcellus',serif; font-size:12px; color:{pct === p ? 'oklch(0.97 0.01 84)' : 'oklch(0.48 0.04 50)'}; cursor:pointer;"
                  >{p}%</button>
                {/each}
              </div>
              <PercentSlider
                bind:value={resourcePercents[resource.type]}
                accent="oklch(0.48 0.12 140)"
              />
            </div>
          {/each}
        </section>
      {/if}

      <!-- Technologies -->
      {#if (civ.researchedTechs ?? []).length > 0}
        <section style="display:flex; flex-direction:column; gap:10px;">
          <h2 style="font-family:'Marcellus',serif; font-size:17px; margin:0; color:oklch(0.35 0.05 45); border-bottom:1px solid oklch(0.85 0.03 60); padding-bottom:6px;">
            Technologies à transmettre
          </h2>
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <button
              type="button"
              onclick={() => (selectedTechs = [...(civ.researchedTechs ?? [])])}
              style="padding:4px 12px; border:1px solid oklch(0.8 0.04 60); border-radius:4px; background:oklch(0.985 0.01 84); font-family:'EB Garamond',serif; font-size:13px; color:oklch(0.45 0.05 50); cursor:pointer;"
            >Tout sélectionner</button>
            <button
              type="button"
              onclick={() => (selectedTechs = [])}
              style="padding:4px 12px; border:1px solid oklch(0.8 0.04 60); border-radius:4px; background:oklch(0.985 0.01 84); font-family:'EB Garamond',serif; font-size:13px; color:oklch(0.45 0.05 50); cursor:pointer;"
            >Tout effacer</button>
            <span style="margin-left:auto; font-family:'Marcellus',serif; font-size:13px; color:oklch(0.5 0.08 140);">
              {selectedTechs.length} / {(civ.researchedTechs ?? []).length}
            </span>
          </div>
          <p style="margin:0; font-family:'EB Garamond',serif; font-size:13px; color:oklch(0.5 0.03 50); font-style:italic;">
            La civilisation mère conserve toutes ses recherches.
          </p>
          <div style="display:flex; flex-wrap:wrap; gap:7px;">
            {#each civ.researchedTechs ?? [] as techId (techId)}
              <button
                type="button"
                onclick={() => toggleTech(techId)}
                style="display:inline-flex; align-items:center; gap:5px; padding:5px 14px; border:1px solid {selectedTechs.includes(techId) ? 'oklch(0.45 0.12 140)' : 'oklch(0.8 0.04 60)'}; border-radius:999px; background:{selectedTechs.includes(techId) ? 'oklch(0.45 0.12 140)' : 'oklch(0.985 0.01 84)'}; font-family:'EB Garamond',serif; font-size:14px; color:{selectedTechs.includes(techId) ? 'oklch(0.97 0.01 84)' : 'oklch(0.4 0.04 50)'}; cursor:pointer;"
              >
                {#if selectedTechs.includes(techId)}<span style="font-size:11px; font-weight:700;">✓</span>{/if}
                {techNames[techId] ?? techId}
              </button>
            {/each}
          </div>
        </section>
      {/if}

      <!-- Submit -->
      <div style="border-top:1px solid oklch(0.85 0.03 60); padding-top:20px;">
        <button
          type="submit"
          disabled={!canSubmit}
          style="padding:12px 28px; border:none; border-radius:4px; background:{canSubmit ? 'oklch(0.5 0.13 34)' : 'oklch(0.75 0.02 50)'}; color:oklch(0.96 0.01 84); font-family:'Marcellus',serif; font-size:17px; cursor:{canSubmit ? 'pointer' : 'not-allowed'}; box-shadow:{canSubmit ? '0 4px 12px rgba(80,30,20,.24)' : 'none'}; transition:background 0.15s ease, transform 0.1s ease;"
        >
          {submitting ? 'Fondation en cours…' : '🌍 Fonder la colonie'}
        </button>
      </div>
    </form>
  </div>
</div>
