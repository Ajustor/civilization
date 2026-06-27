<script lang="ts">
  import type { PageData, ActionData } from './$types'
  import { enhance } from '$app/forms'
  import { techNames, resourceNames } from '$lib/translations'
  import Breadcrumb from '$lib/components/Breadcrumb.svelte'
  import { toast } from 'svelte-sonner'
  import { goto } from '$app/navigation'

  let { data, form }: { data: PageData; form: ActionData } = $props()

  const civ = $derived(data.civilization)
  const totalPeople = $derived(civ.citizensCount ?? 0)

  let colonyName = $state('')
  let populationPercent = $state(20)
  let resourcePercents = $state<Record<string, number>>(
    Object.fromEntries((civ.resources ?? []).map((r) => [r.type, 0])),
  )
  let selectedTechs = $state<string[]>([])

  const transferCount = $derived(
    Math.floor((totalPeople * populationPercent) / 100),
  )
  const remainingCount = $derived(totalPeople - transferCount)
  const popValid = $derived(remainingCount >= 10 && transferCount >= 1)
  const canSubmit = $derived(colonyName.trim().length >= 3 && popValid)

  const resourcesPayload = $derived(
    (civ.resources ?? [])
      .filter((r) => (resourcePercents[r.type] ?? 0) > 0)
      .map((r) => ({
        type: r.type,
        amount: Math.floor(
          (r.quantity * (resourcePercents[r.type] ?? 0)) / 100,
        ),
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

  {#if form?.error}
    <p class="form-error">{form.error}</p>
  {/if}

  <form
    method="POST"
    action="?/colonize"
    use:enhance={() => ({
      onResult({ result }) {
        if (result.type === 'redirect') {
          toast.success('Colonie fondée avec succès !')
          goto(result.location)
        } else if (result.type === 'failure') {
          toast.error(
            (result.data as { error?: string })?.error ??
              'Une erreur est survenue',
          )
        }
      },
    })}
    class="colonize-form"
  >
    <!-- JSON serialization of arrays -->
    <input type="hidden" name="resources" value={JSON.stringify(resourcesPayload)} />
    <input type="hidden" name="techs" value={JSON.stringify(selectedTechs)} />

    <!-- Colony name -->
    <section class="form-section">
      <h2>Nom de la colonie</h2>
      <input
        type="text"
        name="colonyName"
        bind:value={colonyName}
        minlength="3"
        required
        placeholder="Ex. : Nova Carthago"
        class="text-input"
      />
    </section>

    <!-- Population -->
    <section class="form-section">
      <h2>Population</h2>
      <div class="pop-stats">
        <span>Transférer {populationPercent}% → <strong>{transferCount}</strong> colons</span>
        <span>Mère conserve <strong>{remainingCount}</strong></span>
      </div>
      {#if !popValid && totalPeople > 0}
        <p class="field-warning">
          La mère doit conserver au moins 10 habitants.
        </p>
      {/if}
      <input
        type="range"
        name="populationPercent"
        min="5"
        max="50"
        bind:value={populationPercent}
        class="range-input"
      />
    </section>

    <!-- Resources -->
    {#if (civ.resources ?? []).length > 0}
      <section class="form-section">
        <h2>Ressources</h2>
        {#each civ.resources ?? [] as resource (resource.type)}
          {@const pct = resourcePercents[resource.type] ?? 0}
          {@const transferAmt = Math.floor((resource.quantity * pct) / 100)}
          <div class="resource-row">
            <span class="resource-name">
              {resourceNames[resource.type] ?? resource.type}
            </span>
            <input
              type="range"
              min="0"
              max="100"
              bind:value={resourcePercents[resource.type]}
              class="range-input range-flex"
            />
            <span class="resource-amount">
              {pct}% → {transferAmt}
            </span>
          </div>
        {/each}
      </section>
    {/if}

    <!-- Technologies -->
    {#if (civ.researchedTechs ?? []).length > 0}
      <section class="form-section">
        <h2>Technologies à transmettre</h2>
        <p class="section-hint">
          La mère conserve toutes ses recherches. Choisissez ce que vous transmettez.
        </p>
        <div class="tech-grid">
          {#each civ.researchedTechs ?? [] as techId (techId)}
            <label
              class="tech-label"
              class:selected={selectedTechs.includes(techId)}
            >
              <input
                type="checkbox"
                checked={selectedTechs.includes(techId)}
                onchange={() => toggleTech(techId)}
              />
              {techNames[techId] ?? techId}
            </label>
          {/each}
        </div>
      </section>
    {/if}

    <!-- Submit -->
    <button type="submit" disabled={!canSubmit} class="submit-btn" class:enabled={canSubmit}>
      Fonder la colonie
    </button>
  </form>
</div>

<style>
  .form-error {
    font-family: 'EB Garamond', serif;
    color: oklch(0.5 0.18 25);
    margin: 0 0 16px;
    font-size: 15px;
  }

  .colonize-form {
    display: flex;
    flex-direction: column;
    gap: 24px;
    max-width: 560px;
  }

  .form-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .form-section h2 {
    font-family: 'Marcellus', serif;
    font-size: 18px;
    margin: 0;
    color: oklch(0.3 0.04 40);
    border-bottom: 1px solid oklch(0.85 0.03 60);
    padding-bottom: 6px;
  }

  .text-input {
    width: 100%;
    padding: 8px 10px;
    border: 1px solid oklch(0.74 0.05 60);
    border-radius: 4px;
    font-family: 'EB Garamond', serif;
    font-size: 15px;
    background: oklch(0.985 0.01 84);
    color: oklch(0.25 0.03 40);
    box-sizing: border-box;
  }

  .text-input:focus {
    outline: none;
    border-color: oklch(0.55 0.1 140);
    box-shadow: 0 0 0 2px oklch(0.55 0.1 140 / 0.2);
  }

  .pop-stats {
    display: flex;
    justify-content: space-between;
    font-family: 'EB Garamond', serif;
    font-size: 14px;
    color: oklch(0.45 0.06 40);
  }

  .field-warning {
    margin: 0;
    font-family: 'EB Garamond', serif;
    font-size: 13px;
    color: oklch(0.5 0.18 25);
  }

  .range-input {
    width: 100%;
    accent-color: oklch(0.48 0.12 140);
    cursor: pointer;
  }

  .resource-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 4px;
  }

  .resource-name {
    width: 130px;
    font-family: 'EB Garamond', serif;
    font-size: 14px;
    color: oklch(0.35 0.04 45);
    flex-shrink: 0;
  }

  .range-flex {
    flex: 1;
    width: auto;
  }

  .resource-amount {
    width: 90px;
    font-family: 'EB Garamond', serif;
    font-size: 13px;
    color: oklch(0.45 0.06 40);
    text-align: right;
    flex-shrink: 0;
  }

  .section-hint {
    margin: 0;
    font-family: 'EB Garamond', serif;
    font-size: 13px;
    color: oklch(0.5 0.03 50);
    font-style: italic;
  }

  .tech-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .tech-label {
    display: flex;
    align-items: center;
    gap: 5px;
    font-family: 'EB Garamond', serif;
    font-size: 14px;
    cursor: pointer;
    padding: 4px 10px;
    border: 1px solid oklch(0.8 0.04 60);
    border-radius: 4px;
    background: oklch(0.985 0.01 84);
    transition: background 0.12s ease, border-color 0.12s ease;
  }

  .tech-label.selected {
    background: oklch(0.93 0.06 110 / 0.4);
    border-color: oklch(0.6 0.1 130);
    color: oklch(0.3 0.08 130);
  }

  .submit-btn {
    align-self: flex-start;
    padding: 10px 24px;
    background: oklch(0.75 0.02 50);
    color: oklch(0.96 0.01 84);
    border: none;
    border-radius: 4px;
    font-family: 'Marcellus', serif;
    font-size: 16px;
    cursor: not-allowed;
    transition: background 0.15s ease, transform 0.1s ease;
  }

  .submit-btn.enabled {
    background: oklch(0.45 0.1 140);
    cursor: pointer;
  }

  .submit-btn.enabled:hover {
    background: oklch(0.4 0.12 140);
    transform: translateY(-1px);
  }
</style>
